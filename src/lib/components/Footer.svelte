<script lang="ts">
	import { page } from '$app/stores';
	import { Home, FileText, Bookmark, Search, Settings } from '@lucide/svelte';

	const btn =
		'flex flex-1 flex-col items-center justify-center h-full rounded-lg p-1.5 transition-colors duration-150';

	const navItems: { href: string; icon: any }[] = [
		{ href: '/', icon: Home },
		{ href: '/page', icon: FileText },
		{ href: '/bookmark', icon: Bookmark },
		{ href: '/search', icon: Search },
		{ href: '/settings', icon: Settings }
	];
</script>

<div class="m-8"></div>

<footer
	class="
    fixed bottom-0 left-0 z-20 flex h-16 w-full items-center
    border-t border-slate-200
    bg-slate-50/90 shadow backdrop-blur-sm
    dark:border-slate-700 dark:bg-slate-900/90
  "
>
	{#each navItems as item (item.href)}
		<a
			href={item.href}
			class={`${btn} ${
				$page.url.pathname === item.href
					? 'bg-emerald-600 text-white shadow dark:bg-emerald-400 dark:text-slate-900'
					: 'text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-700/30'
			}`}
			aria-label={item.href.substring(1) || 'home'}
		>
			<item.icon class="h-8 w-8" />
		</a>
	{/each}
</footer>
