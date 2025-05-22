<script lang="ts">
import { onMount } from "svelte";
import { page } from "$app/stores";
import SiteCard from "$lib/components/SiteCard.svelte";

type Site = {
	url: string;
	domain: string;
	title: string;
	description: string;
	category: string;
	last_access: string;
};

let sites: Site[] = [];
let loading = true;

onMount(async () => {
	const res = await fetch("/api/page");
	const data = await res.json();
	sites = data.sites;
	loading = false;
});
</script>

{#if loading}
  <p class="text-white text-center">読み込み中...</p>
{:else}
  <div class="p-2 grid grid-cols-2 gap-4">
    {#each sites as site}
      <SiteCard {site} />
    {/each}
  </div>
{/if}
