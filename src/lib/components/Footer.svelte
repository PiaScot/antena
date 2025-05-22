<script lang="ts">
import { page } from "$app/stores";
import "../../app.css";

import HomeIcon from "$lib/assets/icons/HomeIcon.svelte";
import Page from "$lib/assets/icons/Page.svelte";
import Bookmark from "$lib/assets/icons/Bookmark.svelte";
import Search from "$lib/assets/icons/Search.svelte";
import Settings from "$lib/assets/icons/Settings.svelte";

const btn = "flex flex-col items-center rounded-lg p-1.5 transition-colors";

const navItems = [
	{ href: "/", icon: HomeIcon },
	{ href: "/page", icon: Page },
	{ href: "/bookmark", icon: Bookmark },
	{ href: "/search", icon: Search },
	{ href: "/settings", icon: Settings },
];
</script>

<div class="m-8"></div>
<footer
	class="
		fixed bottom-0 left-0 z-20 flex h-16 w-full items-center justify-between
		px-4 py-4
		bg-white/80 dark:bg-zinc-900/80
		border-t border-zinc-300 dark:border-zinc-700
		backdrop-blur-sm shadow-lg/20
		outline-black outline
	"
>
	{#each navItems as item (item.href)}
		<a
			href={item.href}
			class="{btn} {$page.url.pathname === item.href
				? 'bg-blue-200 text-white dark:bg-pink-500'
				: ''}"
		>
			<svelte:component this={item.icon} attr="w-10 h-10" />
		</a>
	{/each}
</footer>

<style>
	.flex-col {
		width: 72px; /* Adjust as needed */
	}
</style>
