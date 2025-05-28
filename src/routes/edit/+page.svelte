<script lang="ts">
import EditHome from "$lib/components/EditHome.svelte";
import EditPage from "$lib/components/EditPage.svelte";
import { page } from "$app/stores";

// どの編集内容を出すか
let from: string = "";
$: from = $page.url.searchParams.get("from") ?? "";
</script>

{#if from === 'home'}
  <EditHome />
{:else if from === 'page'}
  <EditPage />
{:else}
  <div class="p-8 text-center text-lg">編集タイプを選んでください。</div>
{/if}
