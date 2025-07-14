import { writable } from 'svelte/store';

export const isLayoutEditMode = writable<boolean>(false);
