import { writable } from "svelte/store";
import type { FullArticleData } from "$lib/types";

export const activeArticle = writable<FullArticleData | null>(null);
