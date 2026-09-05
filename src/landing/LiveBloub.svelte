<script lang="ts">
  import { Bloub, type BloubProps } from '../lib'
  let { class: className = '', ...props }: BloubProps = $props()
</script>

<div class={className}><Bloub {...props} /></div>
