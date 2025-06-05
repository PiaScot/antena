<script lang="ts">
import "../app.css";

import { theme } from "$lib/stores/theme";
import { fontSize, fontSizeClassMap } from "$lib/stores/theme";
import Header from "$lib/components/Header.svelte";
import Footer from "$lib/components/Footer.svelte";
import { page } from "$app/stores";
import { injectSpeedInsights } from "@vercel/speed-insights/sveltekit";
let article = null;

injectSpeedInsights();

$: {
	// 記事詳細ページか
	const isArticlePage = $page.url.pathname.startsWith("/articles/");
	if (isArticlePage) {
		// ページデータが<slot />経由で渡されている場合
		// 通常はdata.articleとしているはず
		// $page.dataは常に存在する保証はないのでguard
		article = $page?.data.article ? $page?.data.article : null;
	} else {
		article = null;
	}
}
</script>

<svelte:head>
  {#if typeof document !== 'undefined'}
    {@const applyHtmlClasses = () => {
      const htmlEl = document.documentElement;

      if ($theme === 'dark') {
        htmlEl.classList.add('dark');
      } else {
        htmlEl.classList.remove('dark');
      }

      if (fontSizeClassMap && typeof fontSizeClassMap === 'object') {
        Object.values(fontSizeClassMap).forEach(cls => {
          if (typeof cls === 'string' && htmlEl.classList.contains(cls)) {
            htmlEl.classList.remove(cls);
          }
        });
      }
      if ($fontSize && fontSizeClassMap && fontSizeClassMap[$fontSize]) {
        htmlEl.classList.add(fontSizeClassMap[$fontSize]);
      }
    }}

    {$theme, $fontSize, (() => {
      if (typeof window !== 'undefined') {
        requestAnimationFrame(applyHtmlClasses);
      }
    })()}
  {/if}
</svelte:head>

<div class="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300">
  <!-- 記事詳細ページなら article を渡す -->
  <Header {article} />

  <main class="flex-1 w-full">
    <slot />
  </main>

  {#if !$page.url.pathname.startsWith("/articles/")}
    <Footer />
  {/if}
</div>
