import type { FullArticleData } from '$lib/types';
import { writable } from 'svelte/store';

export const activeArticle = writable<FullArticleData | null>(null);
