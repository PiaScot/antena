import { writable } from "svelte/store";
import type { Article } from "$lib/types";

export const cache = writable<Record<string, Article[]>>({});
