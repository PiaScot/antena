import { browser } from '$app/environment';
import { writable } from 'svelte/store';

type Theme = 'light' | 'dark';

function init(): Theme {
	if (!browser) return 'light';
	return (localStorage.getItem('theme') as Theme) || 'light';
}

export const theme = writable<Theme>(init());

if (browser) {
	theme.subscribe((val) => {
		document.documentElement.classList.toggle('dark', val === 'dark');
		localStorage.setItem('theme', val);
	});
}

export type FontSizeValue = 'small' | 'medium' | 'large';
export const fontSize = writable<FontSizeValue>('small');
export const fontSizeClassMap: Record<FontSizeValue, string> = {
	small: 'text-xs', // 0.75rem (12px)
	medium: 'text-sm', // 0.875rem (14px)
	large: 'text-lg' // 1.125rem (18px)
};
