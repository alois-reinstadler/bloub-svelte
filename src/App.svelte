<script lang="ts">
  import { onMount, tick, untrack } from 'svelte'
  import { base } from '$app/paths'
  import BotTile from '@/components/BotTile.svelte'
  import Customizer from '@/components/Customizer.svelte'
  import BloubBot from '@/lib/internal/BloubRenderer.svelte'
  import ExportBar from '@/components/ExportBar.svelte'
  import CycleDialog from '@/components/CycleDialog.svelte'
  import GifDialog from '@/components/GifDialog.svelte'
  import Settings from '@/components/Settings.svelte'
  import SideRail, { type ViewId } from '@/components/SideRail.svelte'
  import Timeline from '@/components/Timeline.svelte'
  import { cycleName, t } from '@/i18n'
  import { copyImage, copyText, cycleToGif, cycleToMp4, standaloneSvg, download, toAnimatedGif, toPng, toAnimatedSvg } from '@/ui/capture'
  import { ACTION_BY_ID, ANIMATION_FRAMES, ANIMATION_STEP, CYCLE_SIZE, DEFAULT_GIF_BACKGROUND, DEFAULT_CYCLE_FORMAT, GIF_IMAGES, GIF_PAS, WHITE, ExportCancelled, backgroundColor, cycleFrames, cycleStep, fileName, type ActionId, type ExportState, type GifBackground, type CycleFormat } from '@/ui/export'
  import { MOODS } from '@/lib/internal/gaze'
  import { INTRO, INTRO_GAZE, POSE_AT, introDue } from '@/ui/intro'
  import { readStorage, writeStorage, type StoredName } from '@/ui/storage'
  import { blockAt, blocksWith, defaultCycle, makeBlock, parseCycles, totalDuration, type Cycle } from '@/lib/internal/core/cycles'
  import { DEFAULT_EXPRESSION, EXPRESSION_BY_ID } from '@/lib/internal/core/expressions'
  import { COLOR_BY_ID, DEFAULT_COLOR, DEFAULT_SHAPE, SHAPE_BY_ID } from '@/lib/internal/core/skins'
  import { POSES, SEQUENCE, STATES, type StateId } from '@/lib/internal/core/states'

  let {
    embedded = false,
    journey = false,
    journeySection = 'studio'
  }: {
    embedded?: boolean
    journey?: boolean
    journeySection?: 'hero' | 'docs' | 'studio'
  } = $props()

  function readHash() {
    const params = new URLSearchParams(location.hash.slice(1))
    const asked = params.get('etat') as StateId | null
    const known = STATES.some((item) => item.id === asked)
    return { state: known ? asked! : 'idle' as StateId, named: known, playing: !params.has('stop'), gallery: params.has('planche'), arrivee: params.has('arrivee') }
  }
  function stored(name: StoredName, fallback: string, exists: (value: string) => boolean) { const value = readStorage(name); return value && exists(value) ? value : fallback }

  const initial = readHash()
  let gallery = $state(initial.gallery)
  const calmQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  let calm = $state(calmQuery.matches)
  const [navigationEntry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  const navigation = navigationEntry?.type ?? 'navigate'
  let intro = $state(untrack(() => !embedded && (initial.arrivee || introDue({ named: initial.named, gallery: initial.gallery, rechargement: navigation !== 'navigate', calme: calm }))))

  const restored = parseCycles(readStorage('cycles'))
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
  let shape = $state(stored('shape', DEFAULT_SHAPE, (value) => SHAPE_BY_ID.has(value)))
  let color = $state(stored('color', DEFAULT_COLOR, (value) => COLOR_BY_ID.has(value)))
  let expression = $state(stored('expression', DEFAULT_EXPRESSION, (value) => EXPRESSION_BY_ID.has(value)))
  let shownShape = $derived(view === 'reglages' || bare ? DEFAULT_SHAPE : shape)
  let mood = $state<string | null>(null)
  let shownExpression = $derived(
    journey && journeySection !== 'studio'
      ? journeySection === 'hero' ? 'curious' : 'attentive'
      : (mood ?? expression)
  )
  let order = $derived(SEQUENCE.map((id) => STATES.find((item) => item.id === id)!))
  let bot = $state<{ seek: (index: number, offset?: number) => void; getSvg: () => SVGSVGElement } | undefined>()
  const NOM = 'BLOUB'

  let saveTimer: ReturnType<typeof setTimeout>
  $effect(() => { cycles; clearTimeout(saveTimer); saveTimer = setTimeout(() => writeStorage('cycles', JSON.stringify(cycles)), 250) })
  $effect(() => writeStorage('cycle', activeId))
  $effect(() => writeStorage('shape', shape))
  $effect(() => writeStorage('color', color))
  $effect(() => writeStorage('expression', expression))

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
  $effect(() => { if (view !== 'reglages') { mood = null; return } let index = 0; const timer = setInterval(() => { mood = MOODS[index % MOODS.length]!; index++ }, 4200); return () => clearInterval(timer) })

  function addBlock(id: StateId) { cycles = cycles.map((item) => item.id === cycle.id ? { ...item, blocks: blocksWith(item.blocks, id) } : item) }
  function onSeek(time: number) { const { index, elapsed: offset } = blockAt(cycle.blocks, time); bot?.seek(index, offset) }

  let cycleDialog = $state(false)
  let cycleFormat = $state<CycleFormat>(DEFAULT_CYCLE_FORMAT)
  let cycleBackground = $state<GifBackground>(DEFAULT_GIF_BACKGROUND)
  let cycleProgress = $state<number | null>(null)
  let cycleError = $state(false)
  let cycleAbort: AbortController | null = null
  async function exportCycle() {
    if (cycleProgress !== null) return
    cycleError = false; const controller = new AbortController(); cycleAbort = controller
    const blocks = cycle.blocks; const format = cycleFormat; const images = cycleFrames(totalDuration(blocks), format); const step = cycleStep(format); const size = CYCLE_SIZE[format]
    const settings = { shape, color, expression }; const progress = (done: number, total: number) => (cycleProgress = done / total); cycleProgress = 0
    try { const mp4 = format === 'mp4'; const file = mp4 ? await cycleToMp4(settings, blocks, size, images, step, WHITE, progress, controller.signal) : await cycleToGif(settings, blocks, size, images, step, backgroundColor(cycleBackground), progress, controller.signal); download(file, fileName(cycleName(cycle), '', '', mp4 ? 'mp4' : 'gif')); cycleDialog = false }
    catch (error) { if (!(error instanceof ExportCancelled)) cycleError = true }
    finally { cycleProgress = null; cycleAbort = null }
  }
  function cancelCycle() { cycleAbort?.abort() }
  $effect(() => { if (cycleDialog) cycleError = false })

  let exportState = $state<ExportState>('pret')
  let confirmation: ReturnType<typeof setTimeout> | undefined
  let gifBackground = $state<GifBackground>(DEFAULT_GIF_BACKGROUND)
  let gifDialog = $state(false)
  async function exportAvatar(id: ActionId, confirmed = false) {
    if (exportState === 'occupe') return
    if (!confirmed && ACTION_BY_ID.get(id)?.mode === 'gif') { gifDialog = true; return }
    const action = ACTION_BY_ID.get(id); const svg = bot?.getSvg(); if (!action || !svg) return
    clearTimeout(confirmation); exportState = 'occupe'; const name = () => fileName(shape, expression, color, action.extension, action.suffixe)
    try {
      if (action.mode === 'anime') { download(await toAnimatedSvg({ shape, color, expression }, action.taille, ANIMATION_FRAMES, ANIMATION_STEP), name()); exportState = 'exporte' }
      else if (action.mode === 'gif') { download(await toAnimatedGif({ shape, color, expression }, action.taille, GIF_IMAGES, GIF_PAS, backgroundColor(gifBackground)), name()); exportState = 'exporte' }
      else { const markup = standaloneSvg(svg, action.taille); if (action.mode === 'copieImage') { await copyImage(toPng(markup, action.taille)); exportState = 'copyImage' } else if (action.mode === 'copyText') { await copyText(markup); exportState = 'copyImage' } else { download(action.extension === 'svg' ? new Blob([markup], { type: 'image/svg+xml' }) : await toPng(markup, action.taille), name()); exportState = 'exporte' } }
    } catch { exportState = 'erreur' }
    confirmation = setTimeout(() => (exportState = 'pret'), 1800)
  }

  onMount(() => {
    const onCalm = (event: MediaQueryListEvent) => (calm = event.matches)
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') preview = false }
    const save = () => writeStorage('cycles', JSON.stringify(cycles))
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
  <div class="studio-shell" class:studio-shell--embedded={embedded}>
  <svelte:element this={embedded ? 'h2' : 'h1'} class="sr-only">{t('app.name')}</svelte:element>
  {#if !embedded}<a class="fixed top-5 right-5 z-20 rounded-lg border border-black/10 bg-white/80 px-3 py-2 text-xs font-semibold text-[var(--ink)] shadow-sm backdrop-blur transition hover:bg-white" href={`${base}/#docs`}>Docs</a>{/if}
  {#if !preview}<SideRail bind:view {embedded} class="rail" inert={bare || undefined}/>{:else}<button type="button" class="{embedded ? 'absolute' : 'fixed'} top-5 right-5 z-30 flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 text-xs text-[var(--muted)] shadow-sm backdrop-blur transition hover:text-[var(--ink)]" onclick={() => (preview = false)}>{t('preview.exit')} <kbd class="rounded bg-black/5 px-1 py-0.5 text-[10px]">{t('preview.key')}</kbd></button>{/if}
  <div class="scene min-h-full items-stretch justify-center p-8 max-lg:flex max-lg:flex-col max-lg:gap-10 max-lg:px-5 {!preview && view === 'animations' ? 'pb-[calc(var(--timeline)_+_1rem)]' : ''} {!preview ? 'max-lg:pt-20' : ''} {bare || preview ? 'scene--seule' : view === 'reglages' ? 'scene--gauche' : ''}">
    {#if !preview}<aside class="panneau scene__gauche w-full lg:flex lg:h-[calc(100dvh_-_3rem_-_var(--timeline))] lg:w-80 lg:shrink-0 lg:flex-col lg:justify-center lg:self-start lg:-translate-y-12 lg:pl-14 {leftOpen ? 'panneau--ouvert max-lg:order-2' : 'max-lg:hidden'}" inert={!leftOpen || undefined}><Settings/></aside>{/if}
    <svelte:element this={embedded ? 'div' : 'main'} class="scene__avatar relative flex flex-1 items-center justify-center max-lg:order-1 max-lg:flex-col max-lg:gap-4 lg:self-start {preview ? 'lg:min-h-[calc(100dvh_-_4rem)]' : 'lg:min-h-[calc(100dvh_-_3rem_-_var(--timeline))]'}">
      <div class="avatar flex aspect-square w-full items-center justify-center {preview ? 'max-w-[min(560px,calc(100dvh_-_6rem))]' : 'max-w-[min(460px,calc(100dvh_-_var(--timeline)_-_7rem))]'} {bare ? 'avatar--intro' : ''} {view === 'reglages' && !preview ? 'avatar--geant' : ''} {journey ? 'avatar--journey' : ''}">
        <BloubBot bind:this={bot} class="h-auto max-w-full" bind:state={botState} bind:block bind:elapsed bind:playing cycle={played} size={preview ? 560 : 440} shape={shownShape} {color} expression={shownExpression} follow={journey ? journeySection === 'hero' : view === 'reglages'} gaze={intro ? INTRO_GAZE : null}/>
      </div>
      {#if view === 'personnaliser' && !preview}<div class="barre-export {bare || exportBarHidden ? 'barre-export--cachee' : ''}" inert={bare || exportBarHidden}><ExportBar etat={exportState} onexporter={exportAvatar}/></div>{/if}
      {#if view === 'animations' && !preview}<CycleDialog bind:open={cycleDialog} bind:format={cycleFormat} bind:fond={cycleBackground} avancement={cycleProgress} erreur={cycleError} onconfirm={exportCycle} onannuler={cancelCycle}/>{/if}
      {#if view === 'personnaliser' && !preview}<GifDialog bind:open={gifDialog} bind:fond={gifBackground} onconfirm={() => exportAvatar('gif', true)}/>{/if}
    </svelte:element>
    {#if !preview}<aside class="panneau scene__droite w-full lg:w-80 lg:shrink-0 {rightOpen ? 'panneau--ouvert max-lg:order-2' : 'max-lg:hidden'}" inert={!rightOpen || undefined}>{#if view === 'animations'}<h2 class="text-sm font-semibold">{t('panel.animations')}</h2><div class="mt-2 grid grid-cols-4 gap-1.5">{#each order as item (item.id)}<BotTile label={t(`states.${item.id}`)} selected={item.id === botState} state={item.id} {shape} {color} {expression} frozenAt={POSES[item.id]} onclick={() => addBlock(item.id)}/>{/each}</div>{:else}<Customizer bind:shape bind:color bind:expression/>{/if}</aside>{/if}
  </div>
  {#if view === 'reglages' && !preview}<p class="wordmark" aria-hidden="true">{NOM}</p>{/if}
  {#if view === 'animations' && !preview}<Timeline bind:cycles bind:activeId bind:block bind:playing {elapsed} {shape} {color} {expression} {embedded} onseek={onSeek} onpreview={() => (preview = true)} onexporter={() => (cycleDialog = true)}/>{/if}
  </div>
{/if}
