<script lang="ts">
  import { onMount, tick, untrack } from 'svelte'
  import BotTile from '@/components/BotTile.svelte'
  import Customizer from '@/components/Customizer.svelte'
  import BloubBot from '@/components/BloubBot.svelte'
  import ExportBar from '@/components/ExportBar.svelte'
  import CycleDialog from '@/components/CycleDialog.svelte'
  import GifDialog from '@/components/GifDialog.svelte'
  import Settings from '@/components/Settings.svelte'
  import SideRail, { type ViewId } from '@/components/SideRail.svelte'
  import Timeline from '@/components/Timeline.svelte'
  import { nomDeCycle, t } from '@/i18n'
  import { copie, copieTexte, cycleVersGif, cycleVersMp4, svgAutonome, telecharge, versGifAnime, versPng, versSvgAnime } from '@/ui/capture'
  import { ACTION_BY_ID, ANIM_IMAGES, ANIM_PAS, CYCLE_TAILLE, FOND_GIF_DEFAUT, FORMAT_CYCLE_DEFAUT, GIF_IMAGES, GIF_PAS, BLANC, Abandon, couleurDeFond, cycleImages, cyclePas, nomFichier, type ActionId, type EtatExport, type FondGif, type FormatCycle } from '@/ui/export'
  import { HUMEURS } from '@/ui/gaze'
  import { INTRO, INTRO_GAZE, POSE_AT, introDue } from '@/ui/intro'
  import { ecris, lis, type NomStocke } from '@/ui/stockage'
  import { blockAt, blocksWith, defaultCycle, makeBlock, parseCycles, totalDuration, type Cycle } from '@/bot/cycles'
  import { DEFAULT_EXPRESSION, EXPRESSION_BY_ID } from '@/bot/expressions'
  import { COLOR_BY_ID, DEFAULT_COLOR, DEFAULT_SHAPE, SHAPE_BY_ID } from '@/bot/skins'
  import { POSES, SEQUENCE, STATES, type StateId } from '@/bot/states'

  function readHash() {
    const params = new URLSearchParams(location.hash.slice(1))
    const asked = params.get('etat') as StateId | null
    const known = STATES.some((item) => item.id === asked)
    return { state: known ? asked! : 'idle' as StateId, named: known, playing: !params.has('stop'), gallery: params.has('planche'), arrivee: params.has('arrivee') }
  }
  function stored(name: NomStocke, fallback: string, exists: (value: string) => boolean) { const value = lis(name); return value && exists(value) ? value : fallback }

  const initial = readHash()
  let gallery = $state(initial.gallery)
  const calmQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  let calm = $state(calmQuery.matches)
  const [navigationEntry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  const navigation = navigationEntry?.type ?? 'navigate'
  let intro = $state(initial.arrivee || introDue({ named: initial.named, gallery: initial.gallery, rechargement: navigation !== 'navigate', calme: untrack(() => calm) }))

  const restored = parseCycles(lis('cycles'))
  let cycles = $state<Cycle[]>(restored.length ? restored : [defaultCycle()])
  let activeId = $state(untrack(() => stored('cycle', cycles[0]!.id, (value) => cycles.some((item) => item.id === value))))
  let cycle = $derived(cycles.find((item) => item.id === activeId) ?? cycles[0]!)
  let block = $state(0)
  let elapsed = $state(0)
  function locate(id: StateId) { const order = [cycle, ...cycles.filter((item) => item.id !== activeId)]; for (const item of order) { const index = item.blocks.findIndex((entry) => entry.state === id); if (index >= 0) return { id: item.id, index } } return null }
  if (initial.named) { const found = locate(initial.state); if (found) { activeId = found.id; block = found.index } }
  let botState = $state<StateId>(untrack(() => intro ? 'idle' : (cycle.blocks[block]?.state ?? 'idle')))
  let view = $state<ViewId>(initial.named ? 'animations' : 'personnaliser')
  let preview = $state(false)
  let playing = $state(untrack(() => intro || (initial.playing && view === 'animations')))
  let resume = initial.named && initial.playing
  let resumeBlock = untrack(() => block)
  const REST = [makeBlock('idle')]
  const ENTREE = [makeBlock('swirl'), makeBlock('idle')]
  const ENTREE_CALME = [makeBlock('idle')]
  let played = $derived(intro ? INTRO : view === 'animations' ? cycle.blocks : view !== 'reglages' ? REST : calm ? ENTREE_CALME : ENTREE)
  let bare = $derived(intro && block < POSE_AT)
  let leftOpen = $derived(!bare && view === 'reglages')
  let rightOpen = $derived(!bare && view !== 'reglages')
  let shape = $state(stored('forme', DEFAULT_SHAPE, (value) => SHAPE_BY_ID.has(value)))
  let color = $state(stored('couleur', DEFAULT_COLOR, (value) => COLOR_BY_ID.has(value)))
  let expression = $state(stored('expression', DEFAULT_EXPRESSION, (value) => EXPRESSION_BY_ID.has(value)))
  let shownShape = $derived(view === 'reglages' || bare ? DEFAULT_SHAPE : shape)
  let mood = $state<string | null>(null)
  let order = $derived(SEQUENCE.map((id) => STATES.find((item) => item.id === id)!))
  let bot = $state<{ seek: (index: number, offset?: number) => void; getSvg: () => SVGSVGElement } | undefined>()
  const NOM = 'BLOUB'

  let saveTimer: ReturnType<typeof setTimeout>
  $effect(() => { cycles; clearTimeout(saveTimer); saveTimer = setTimeout(() => ecris('cycles', JSON.stringify(cycles)), 250) })
  $effect(() => ecris('cycle', activeId))
  $effect(() => ecris('forme', shape))
  $effect(() => ecris('couleur', color))
  $effect(() => ecris('expression', expression))

  let previousPreview = untrack(() => preview)
  $effect(() => { if (preview !== previousPreview) { previousPreview = preview; playing = preview } })
  let writtenByUs = ''
  $effect(() => { botState; playing; if (view !== 'animations') return; writtenByUs = `#etat=${botState}${playing ? '' : '&stop'}`; location.replace(writtenByUs) })
  let previousView = untrack(() => view)
  $effect(() => {
    const now = view
    if (now === previousView) return
    const before = previousView; previousView = now; intro = false
    if (before === 'animations') { resume = playing; resumeBlock = block }
    if (now === 'animations') { playing = resume; block = resumeBlock }
    else { block = 0; playing = now === 'reglages' }
    if (now === 'reglages') tick().then(() => bot?.seek(0, 0))
  })
  let previousBlock = untrack(() => block)
  $effect(() => { if (block === previousBlock) return; previousBlock = block; if (intro && block >= INTRO.length - 1) { intro = false; playing = false } else if (!intro && view === 'reglages' && block > 0) playing = false })
  let previousBare = untrack(() => bare)
  let exportBarHidden = $state(false)
  let exportBarTimer: ReturnType<typeof setTimeout> | undefined
  $effect(() => { if (previousBare && !bare) { exportBarHidden = true; clearTimeout(exportBarTimer); exportBarTimer = setTimeout(() => (exportBarHidden = false), 400) } previousBare = bare })
  $effect(() => { if (view !== 'reglages') { mood = null; return } let index = 0; const timer = setInterval(() => { mood = HUMEURS[index % HUMEURS.length]!; index++ }, 4200); return () => clearInterval(timer) })

  function addBlock(id: StateId) { cycles = cycles.map((item) => item.id === cycle.id ? { ...item, blocks: blocksWith(item.blocks, id) } : item) }
  function onSeek(time: number) { const { index, elapsed: offset } = blockAt(cycle.blocks, time); bot?.seek(index, offset) }

  let cycleDialog = $state(false)
  let cycleFormat = $state<FormatCycle>(FORMAT_CYCLE_DEFAUT)
  let cycleBackground = $state<FondGif>(FOND_GIF_DEFAUT)
  let cycleProgress = $state<number | null>(null)
  let cycleError = $state(false)
  let cycleAbort: AbortController | null = null
  async function exportCycle() {
    if (cycleProgress !== null) return
    cycleError = false; const controller = new AbortController(); cycleAbort = controller
    const blocks = cycle.blocks; const format = cycleFormat; const images = cycleImages(totalDuration(blocks), format); const step = cyclePas(format); const size = CYCLE_TAILLE[format]
    const settings = { shape, color, expression }; const progress = (done: number, total: number) => (cycleProgress = done / total); cycleProgress = 0
    try { const mp4 = format === 'mp4'; const file = mp4 ? await cycleVersMp4(settings, blocks, size, images, step, BLANC, progress, controller.signal) : await cycleVersGif(settings, blocks, size, images, step, couleurDeFond(cycleBackground), progress, controller.signal); telecharge(file, nomFichier(nomDeCycle(cycle), '', '', mp4 ? 'mp4' : 'gif')); cycleDialog = false }
    catch (error) { if (!(error instanceof Abandon)) cycleError = true }
    finally { cycleProgress = null; cycleAbort = null }
  }
  function cancelCycle() { cycleAbort?.abort() }
  $effect(() => { if (cycleDialog) cycleError = false })

  let exportState = $state<EtatExport>('pret')
  let confirmation: ReturnType<typeof setTimeout> | undefined
  let gifBackground = $state<FondGif>(FOND_GIF_DEFAUT)
  let gifDialog = $state(false)
  async function exportAvatar(id: ActionId, confirmed = false) {
    if (exportState === 'occupe') return
    if (!confirmed && ACTION_BY_ID.get(id)?.mode === 'gif') { gifDialog = true; return }
    const action = ACTION_BY_ID.get(id); const svg = bot?.getSvg(); if (!action || !svg) return
    clearTimeout(confirmation); exportState = 'occupe'; const name = () => nomFichier(shape, expression, color, action.extension, action.suffixe)
    try {
      if (action.mode === 'anime') { telecharge(await versSvgAnime({ shape, color, expression }, action.taille, ANIM_IMAGES, ANIM_PAS), name()); exportState = 'exporte' }
      else if (action.mode === 'gif') { telecharge(await versGifAnime({ shape, color, expression }, action.taille, GIF_IMAGES, GIF_PAS, couleurDeFond(gifBackground)), name()); exportState = 'exporte' }
      else { const markup = svgAutonome(svg, action.taille); if (action.mode === 'copieImage') { await copie(versPng(markup, action.taille)); exportState = 'copie' } else if (action.mode === 'copieTexte') { await copieTexte(markup); exportState = 'copie' } else { telecharge(action.extension === 'svg' ? new Blob([markup], { type: 'image/svg+xml' }) : await versPng(markup, action.taille), name()); exportState = 'exporte' } }
    } catch { exportState = 'erreur' }
    confirmation = setTimeout(() => (exportState = 'pret'), 1800)
  }

  onMount(() => {
    const onCalm = (event: MediaQueryListEvent) => (calm = event.matches)
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') preview = false }
    const save = () => ecris('cycles', JSON.stringify(cycles))
    const onHash = () => {
      if (location.hash === writtenByUs) { writtenByUs = ''; return }
      const next = readHash(); if (next.arrivee && !initial.arrivee) return location.reload(); gallery = next.gallery; if (next.gallery || !next.named) return
      const found = locate(next.state); if (!found) return; view = 'animations'; activeId = found.id; block = found.index
    }
    calmQuery.addEventListener('change', onCalm); window.addEventListener('keydown', onKey); window.addEventListener('hashchange', onHash); window.addEventListener('pagehide', save)
    return () => { calmQuery.removeEventListener('change', onCalm); window.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', onHash); window.removeEventListener('pagehide', save); clearTimeout(saveTimer); clearTimeout(exportBarTimer); clearTimeout(confirmation) }
  })
</script>

{#if gallery}
  <div class="p-5"><a class="text-xs text-[var(--muted)] underline underline-offset-2" href="./">{t('gallery.back')}</a><div class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">{#each order as item (item.id)}<figure class="flex flex-col items-center"><BloubBot state={item.id} size={210} {shape} {color} {expression} frozenAt={POSES[item.id]}/><figcaption class="text-xs text-[var(--muted)]">{t(`states.${item.id}`)}</figcaption></figure>{/each}</div></div>
{:else}
  <h1 class="sr-only">{t('app.name')}</h1>
  {#if !preview}<SideRail bind:view class="rail" inert={bare || undefined}/>{:else}<button type="button" class="fixed top-5 right-5 z-30 flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 text-xs text-[var(--muted)] shadow-sm backdrop-blur transition hover:text-[var(--ink)]" onclick={() => (preview = false)}>{t('preview.exit')} <kbd class="rounded bg-black/5 px-1 py-0.5 text-[10px]">{t('preview.key')}</kbd></button>{/if}
  <div class="scene min-h-full items-stretch justify-center p-8 max-lg:flex max-lg:flex-col max-lg:gap-10 max-lg:px-5 {!preview && view === 'animations' ? 'pb-[calc(var(--timeline)_+_1rem)]' : ''} {!preview ? 'max-lg:pt-20' : ''} {bare || preview ? 'scene--seule' : view === 'reglages' ? 'scene--gauche' : ''}">
    {#if !preview}<aside class="panneau scene__gauche w-full lg:flex lg:h-[calc(100dvh_-_3rem_-_var(--timeline))] lg:w-80 lg:shrink-0 lg:flex-col lg:justify-center lg:self-start lg:-translate-y-12 lg:pl-14 {leftOpen ? 'panneau--ouvert max-lg:order-2' : 'max-lg:hidden'}"><Settings/></aside>{/if}
    <main class="scene__avatar relative flex flex-1 items-center justify-center max-lg:order-1 max-lg:flex-col max-lg:gap-4 lg:self-start {preview ? 'lg:min-h-[calc(100dvh_-_4rem)]' : 'lg:min-h-[calc(100dvh_-_3rem_-_var(--timeline))]'}">
      <div class="avatar flex aspect-square w-full items-center justify-center {preview ? 'max-w-[min(560px,calc(100dvh_-_6rem))]' : 'max-w-[min(460px,calc(100dvh_-_var(--timeline)_-_7rem))]'} {bare ? 'avatar--intro' : ''} {view === 'reglages' && !preview ? 'avatar--geant' : ''}">
        <BloubBot bind:this={bot} class="h-auto max-w-full" bind:state={botState} bind:block bind:elapsed bind:playing cycle={played} size={preview ? 560 : 440} shape={shownShape} {color} expression={mood ?? expression} follow={view === 'reglages'} gaze={intro ? INTRO_GAZE : null}/>
      </div>
      {#if view === 'personnaliser' && !preview}<div class="barre-export {bare || exportBarHidden ? 'barre-export--cachee' : ''}" inert={bare || exportBarHidden}><ExportBar etat={exportState} onexporter={exportAvatar}/></div>{/if}
      {#if view === 'animations' && !preview}<CycleDialog bind:open={cycleDialog} bind:format={cycleFormat} bind:fond={cycleBackground} avancement={cycleProgress} erreur={cycleError} onconfirm={exportCycle} onannuler={cancelCycle}/>{/if}
      {#if view === 'personnaliser' && !preview}<GifDialog bind:open={gifDialog} bind:fond={gifBackground} onconfirm={() => exportAvatar('gif', true)}/>{/if}
    </main>
    {#if !preview}<aside class="panneau scene__droite w-full lg:w-80 lg:shrink-0 {rightOpen ? 'panneau--ouvert max-lg:order-2' : 'max-lg:hidden'}">{#if view === 'animations'}<h2 class="text-sm font-semibold">{t('panel.animations')}</h2><div class="mt-2 grid grid-cols-4 gap-1.5">{#each order as item (item.id)}<BotTile label={t(`states.${item.id}`)} selected={item.id === botState} state={item.id} {shape} {color} {expression} frozenAt={POSES[item.id]} onclick={() => addBlock(item.id)}/>{/each}</div>{:else}<Customizer bind:shape bind:color bind:expression/>{/if}</aside>{/if}
  </div>
  {#if view === 'reglages' && !preview}<p class="wordmark" aria-hidden="true">{NOM}</p>{/if}
  {#if view === 'animations' && !preview}<Timeline bind:cycles bind:activeId bind:block bind:playing {elapsed} {shape} {color} {expression} onseek={onSeek} onpreview={() => (preview = true)} onexporter={() => (cycleDialog = true)}/>{/if}
{/if}
