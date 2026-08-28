<script lang="ts">
  import { onNavigate } from '$app/navigation'
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()

  onNavigate((navigation) => {
    if (!document.startViewTransition || !navigation.to?.route.id) return

    return new Promise<void>((resolve) => {
      document.startViewTransition(async () => {
        resolve()
        await navigation.complete
      })
    })
  })
</script>

{@render children()}

<style>
  :global(::view-transition-group(bloub-avatar)) {
    animation-duration: 850ms;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }

  :global(::view-transition-old(root)),
  :global(::view-transition-new(root)) {
    animation-duration: 420ms;
    animation-timing-function: ease-out;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(::view-transition-group(*)) {
      animation-duration: 1ms;
    }
  }
</style>
