// src/lib/stores/readArticlesStore.ts

import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const LOCAL_STORAGE_KEY = 'read-articles';

function createReadArticlesStore() {
	let initialValue: string[] = [];
	if (browser) {
		const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (storedValue) {
			initialValue = JSON.parse(storedValue);
		}
	}

	const readArticlesSet: Set<string> = new Set(initialValue);
	const { subscribe, update } = writable(readArticlesSet);

	return {
		subscribe,
		markAsRead: (articleUrl: string) => {
			update((set) => {
				set.add(articleUrl);
				return set;
			});
		},
		isRead: (articleUrl: string) => {
			return readArticlesSet.has(articleUrl);
		}
	};
}

export const readArticles = createReadArticlesStore();

if (browser) {
	readArticles.subscribe((set) => {
		const arrayToStore = Array.from(set);
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(arrayToStore));
	});
}
