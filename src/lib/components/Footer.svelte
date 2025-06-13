<script lang="ts">
import { page } from "$app/stores";
import { Home, FileText, Bookmark, Search, Settings } from "@lucide/svelte";
import type { SvelteComponent, ComponentType } from "svelte";

const btn =
	"flex flex-1 flex-col items-center justify-center h-full rounded-lg p-1.5 transition-colors duration-150";

const navItems: { href: string; icon: ComponentType }[] = [
	{ href: "/", icon: Home },
	{ href: "/page", icon: FileText },
	{ href: "/bookmark", icon: Bookmark },
	{ href: "/search", icon: Search },
	{ href: "/settings", icon: Settings },
];
</script>

<div class="m-8"></div>

<footer
	class="
    fixed bottom-0 left-0 z-20 flex h-16 w-full items-center
    bg-slate-50/90 dark:bg-slate-900/90
    border-t border-slate-200 dark:border-slate-700
    backdrop-blur-sm shadow
  "
>
	{#each navItems as item (item.href)}
		<a
			href={item.href}
			class={`${btn} ${
				$page.url.pathname === item.href
					? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-900 shadow'
					: 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-700/30'
			}`}
			aria-label={item.href.substring(1) || 'home'}
		>
      <item.icon class="w-8 h-8" />
		</a>
	{/each}
</footer>
