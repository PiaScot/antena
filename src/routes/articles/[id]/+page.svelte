<!-- src/routes/articles/[id]/+page.svelte -->
<script lang="ts">
export let data;
const article = data.article;
</script>

<article class="article bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-900 p-4 rounded">
  {@html article.content}
</article>

<style>
    *, *::before, *::after { 
      box-sizing: border-box; 
      margin: 0; 
      padding: 0; 
    } 
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      width: 100vw;
      overflow-x: hidden;
      padding: 8px;
      background: var(--background, white);
      color: var(--text, #333);
    }

    .article {
      border-top: 3px solid #aaa;
      padding: 4px;
      background: var(--article-bg, #fafafa);
      border-radius: 4px;

      overflow-wrap: break-word;
      word-break: break-word;
    }

    .article img,
    .article video {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 8px 0;
    }
    .article iframe,
    .article embed,
    .article object {
      max-width: 100% !important;
      width: 100% !important;
      aspect-ratio: 16/9;
      display: block;
      margin: 8px 0;
    }
    .article iframe[src*="youtube"],
    .article iframe[src*="youtu.be"],
    .article iframe[src*="vimeo"] {
      max-width:100%!important;
      width:100%!important;
      /* height:auto!important; */
      aspect-ratio:16/9;
      display:block;
      margin:8px 0;
    }
    .article iframe[src*="platform.twitter.com"]{
      /* height:auto !important;    */
      aspect-ratio: auto;     
      width: 100% !important; 
    }
    .article table {
      width: 100%;
      overflow-x: auto;
    }

    .article table {
      width: 100%;
      overflow-x: auto;
    }

    table {
      width: 100%;
      display: block;
      overflow-x: auto;
      border-collapse: collapse;
      margin: 12px 0;
    }
    td, th {
      padding: 4px;
      border: 1px solid #ccc;
      font-size: 14px;
    }

    pre, code {
      font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-x: auto;
    }
    pre {
      background: #f7f7f7;
      border: 1px solid #e1e1e1;
      border-radius: 4px;
      padding: 8px;
      margin: 12px 0;
    }

    .idname {
      margin-top: 20px;
      padding: .5rem;
      font-size: 12px;
      background: #eaf3ff;
      border-bottom: 3px solid #516ab6;
    }

    .txt {
      margin: 20px 0 40px 5px;
      font-size: 18px;
      font-weight: bold;
    }
    blockquote {
      border: 1px solid #ccc;
      background: #f0f0f0;
    }
</style>
