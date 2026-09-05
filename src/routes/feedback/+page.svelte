<script lang="ts">
  import { onDestroy } from 'svelte'
  import { base } from '$app/paths'
  import { Bloub, BloubState, type BloubStatus, type MotionPreference } from '@/lib'
  import '../../landing/landing.css'

  const bloub = new BloubState()
  bloub.followCursor()

  let emailInput: HTMLInputElement
  let nameInput: HTMLInputElement
  let deleteButton: HTMLButtonElement
  let message = $state('Bloub folgt deinem Cursor.')
  let emailError = $state('')
  let sending = $state(false)
  let motion = $state<MotionPreference>('auto')

  const statuses: { id: BloubStatus; label: string }[] = [
    { id: 'idle', label: 'Bereit' },
    { id: 'waiting', label: 'Wartet auf Eingabe' },
    { id: 'loading', label: 'Arbeitet' },
    { id: 'empty', label: 'Leer' },
    { id: 'disabled', label: 'Inaktiv' }
  ]

  const statusDescriptions: Record<BloubStatus, string> = {
    idle: 'Bereit. Bloub folgt deiner Aufmerksamkeit.',
    waiting: 'Bloub wartet geduldig auf deine Eingabe. Kein Zeitdruck.',
    loading: 'Die Anwendung arbeitet. Die Punkte zeigen laufende Aktivität.',
    empty: 'Hier ist noch nichts. Bloub schaut neugierig.',
    disabled: 'Gerade nicht verfügbar. Bloub ruht.'
  }

  function focus(target: Element) {
    bloub.lookAt(target)
    message = 'Bloub schaut auf das aktive Element.'
  }

  function resumeCursor() {
    bloub.followCursor()
    message = 'Bloub folgt wieder deinem Cursor.'
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const value = emailInput.value.trim()
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      emailError = 'Bitte gib eine gültige E-Mail-Adresse ein.'
      bloub.react('validation-error', { target: emailInput })
      emailInput.focus()
      message = 'Validierung fehlgeschlagen'
      return
    }

    emailError = ''
    sending = true
    message = 'Formular wird gesendet …'
    bloub.setStatus('loading')
    await new Promise((resolve) => setTimeout(resolve, 1100))
    sending = false
    bloub.setStatus('idle')
    bloub.react('success', { target: emailInput })
    message = 'Eingabe erfolgreich gespeichert.'
  }

  function setStatus(status: BloubStatus) {
    bloub.dismissReaction()
    bloub.setStatus(status)
    message = statusDescriptions[status]
  }

  onDestroy(() => bloub.destroy())
</script>

<svelte:head>
  <title>bloub Feedback-Labor</title>
  <meta name="description" content="Interaktive Beispiele für Bloubs semantische Zustände, Reaktionen und Blicksteuerung." />
</svelte:head>

<main class="lab">
  <header class="lab-header">
    <a href={`${base}/`}>← Zurück zu bloub</a>
    <span>Feedback-Labor</span>
  </header>

  <section class="stage" aria-labelledby="lab-title">
    <div class="avatar-panel">
      <p class="eyebrow">Native Svelte API</p>
      <h1 id="lab-title">Bloub versteht,<br /><em>was gerade passiert.</em></h1>
      <div class="avatar">
        <Bloub controller={bloub} {motion} size={360} label="Bloub reagiert auf die Demo" />
      </div>
      <p class="message" aria-live="polite">{message}</p>
    </div>

    <div class="controls">
      <article>
        <p class="number">01</p>
        <h2>Elemente ansehen</h2>
        <p>Fokus und Fehler übergeben echte Referenzen aus <code>bind:this</code>.</p>
        <form onsubmit={submit} novalidate>
          <label>
            Name
            <input id="demo-name" name="name" autocomplete="name" bind:this={nameInput} onfocus={() => focus(nameInput)} onblur={resumeCursor} placeholder="Ada Lovelace" />
          </label>
          <label>
            E-Mail
            <input
              bind:this={emailInput}
              id="demo-email"
              name="email"
              autocomplete="email"
              type="email"
              aria-invalid={emailError ? 'true' : undefined}
              aria-describedby={emailError ? 'email-error' : undefined}
              onfocus={() => focus(emailInput)}
              onblur={resumeCursor}
              placeholder="ada@example.com"
            />
          </label>
          {#if emailError}<p class="field-error" id="email-error">{emailError}</p>{/if}
          <button class="primary" type="submit" disabled={sending}>{sending ? 'Wird gesendet …' : 'Speichern'}</button>
        </form>
      </article>

      <article>
        <p class="number">02</p>
        <h2>Anwendungszustände</h2>
        <p>Warten auf Eingabe bleibt ruhig. Während die Anwendung arbeitet, zeigen drei sanfte Punkte die Aktivität.</p>
        <div class="button-grid">
          {#each statuses as status}
            <button type="button" aria-pressed={bloub.status === status.id} onclick={() => setStatus(status.id)}>{status.label}</button>
          {/each}
        </div>
      </article>

      <article>
        <p class="number">03</p>
        <h2>Bewegung</h2>
        <label for="motion-preference">Bewegungsmodus</label>
        <select id="motion-preference" bind:value={motion}>
          <option value="auto">Systemeinstellung verwenden</option>
          <option value="full">Volle Bewegung</option>
          <option value="reduced">Reduzierte Bewegung</option>
        </select>
        <p>Reduziert bleiben Ausdrücke und Status sichtbar; Atmung, Blinzeln und Reaktionsgesten pausieren.</p>
      </article>

      <article>
        <p class="number">04</p>
        <h2>Semantische Reaktionen</h2>
        <p>Die Anwendung meldet Bedeutung; Bloub entscheidet über Ausdruck und Bewegung.</p>
        <div class="button-grid reactions">
          <button type="button" onclick={() => { bloub.react('notify'); message = 'Neue Benachrichtigung' }}>Hinweis</button>
          <button type="button" onclick={() => { bloub.react('warning'); message = 'Warnung' }}>Warnung</button>
          <button type="button" onclick={() => { bloub.react('confused'); message = 'Noch unklar' }}>Verwirrt</button>
          <button type="button" onclick={() => { bloub.react('celebrate'); message = 'Geschafft!' }}>Feiern</button>
          <button type="button" onclick={() => { bloub.react('error'); message = 'Aktion fehlgeschlagen' }}>Fehler</button>
          <button
            bind:this={deleteButton}
            type="button"
            onpointerenter={() => bloub.lookAt(deleteButton)}
            onpointerleave={resumeCursor}
            onclick={() => { bloub.react('destructive', { target: deleteButton }); message = 'Destruktive Aktion angefragt' }}
          >Löschen</button>
        </div>
      </article>
    </div>
  </section>
</main>

<style>
  :global(body) { margin: 0; background: #fff; color: #0a0a0a; }
  .lab { min-height: 100svh; font-family: ui-sans-serif, system-ui, sans-serif; }
  .lab-header { height: 68px; padding: 0 clamp(20px, 4vw, 60px); display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e4e4e4; font-size: 13px; font-weight: 650; }
  .lab-header a { color: #6b6b6b; }
  .stage { width: min(1320px, 100%); min-height: calc(100svh - 68px); margin: auto; display: grid; grid-template-columns: minmax(360px, 0.9fr) minmax(520px, 1.1fr); }
  .avatar-panel { position: sticky; top: 0; height: calc(100svh - 68px); padding: clamp(48px, 6vw, 92px); display: flex; flex-direction: column; justify-content: center; border-right: 1px solid #e4e4e4; }
  .eyebrow { justify-content: flex-start; }
  .eyebrow::after { display: none; }
  h1 { margin: 0; font-family: var(--display, sans-serif); font-size: clamp(40px, 4vw, 62px); line-height: 0.98; letter-spacing: -0.04em; }
  h1 em { font-style: normal; font-weight: 250; }
  .avatar { min-height: 330px; display: grid; place-items: center; }
  .avatar :global(svg) { width: min(360px, 100%); height: auto; }
  .message { min-height: 1.5em; margin: 0; text-align: center; color: #6b6b6b; font-size: 13px; }
  .controls { padding: clamp(34px, 5vw, 76px); }
  article { padding: 32px 0 42px; border-bottom: 1px solid #e4e4e4; }
  article:first-child { padding-top: 0; }
  article:last-child { border-bottom: 0; }
  .number { margin: 0 0 10px; font: 700 10px ui-monospace, monospace; color: #6b6b6b; }
  h2 { margin: 0; font-family: var(--display, sans-serif); font-size: 27px; letter-spacing: -0.025em; }
  article > p:not(.number) { max-width: 43em; margin: 8px 0 22px; color: #6b6b6b; font-size: 14px; line-height: 1.55; }
  code { padding: 2px 5px; border-radius: 5px; background: #f4f4f4; color: #0a0a0a; font-size: 12px; }
  form { display: grid; grid-template-columns: 1fr 1fr auto; align-items: end; gap: 12px; }
  label { display: grid; gap: 7px; font-size: 12px; font-weight: 700; }
  input { width: 100%; height: 44px; padding: 0 14px; border: 1.5px solid #d6d6d6; border-radius: 12px; outline: none; font: inherit; }
  input:focus { border-color: #0a0a0a; box-shadow: 0 0 0 3px rgb(10 10 10 / 0.08); }
  input[aria-invalid='true'] { border-color: #0a0a0a; border-style: dashed; }
  button { min-height: 42px; padding: 0 16px; border: 1.5px solid #0a0a0a; border-radius: 999px; color: #0a0a0a; background: #fff; cursor: pointer; font-size: 12px; font-weight: 700; }
  select { width: 100%; margin-top: 10px; padding: 12px; border: 1px solid #d6d6d6; border-radius: 12px; background: #fff; color: inherit; font: inherit; }
  button[aria-pressed="true"] { background: #0a0a0a; color: #fff; }
  button:hover { color: #fff; background: #0a0a0a; }
  button:focus-visible { outline: 3px solid rgb(10 10 10 / 0.2); outline-offset: 2px; }
  button:disabled { cursor: wait; opacity: 0.5; }
  button.primary { height: 44px; color: #fff; background: #0a0a0a; }
  .field-error { grid-column: 1 / -1; margin: -3px 0 0; font-size: 12px; font-weight: 650; }
  .button-grid { display: flex; flex-wrap: wrap; gap: 9px; }
  .reactions button:last-child { border-style: dashed; }
  @media (max-width: 850px) {
    .stage { display: block; }
    .avatar-panel { position: relative; height: auto; min-height: 620px; border-right: 0; border-bottom: 1px solid #e4e4e4; }
    .controls { padding-inline: 24px; }
  }
  @media (max-width: 600px) {
    .avatar-panel { min-height: 560px; padding-inline: 24px; }
    form { grid-template-columns: 1fr; }
    .field-error { grid-column: auto; }
  }
  @media (prefers-reduced-motion: reduce) {
    button { transition: none; }
  }
</style>
