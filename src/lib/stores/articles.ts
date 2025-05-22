import { writable } from "svelte/store";
import type { Article } from "$lib/types";

const cache = writable<Record<string, Article[]>>({});

export default cache;
