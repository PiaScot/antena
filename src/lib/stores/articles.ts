import type { Article } from '$lib/types';
import { writable } from 'svelte/store';

export const cache = writable<Record<string, Article[]>>({});
