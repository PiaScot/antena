import { writable } from 'svelte/store';
import type { FullArticleData } from '$lib/types';

interface PageContext {
  article: FullArticleData | null;
  isBookmarked: boolean;
}

export const pageContext = writable<PageContext>({
  article: null,
  isBookmarked: false
});
