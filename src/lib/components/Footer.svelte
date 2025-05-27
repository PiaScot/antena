<script lang="ts">
import { page } from "$app/stores";
import HomeIcon from "$lib/assets/icons/HomeIcon.svelte";
import Page from "$lib/assets/icons/Page.svelte";
import Bookmark from "$lib/assets/icons/Bookmark.svelte";
import Search from "$lib/assets/icons/Search.svelte";
import Settings from "$lib/assets/icons/Settings.svelte";

const btn =
	"flex flex-col items-center rounded-lg p-1.5 transition-colors duration-150 w-16";
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
    >
      <svelte:component this={item.icon} class="w-7 h-7" />
    </a>
  {/each}
</footer>
