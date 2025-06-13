// src/lib/stores/categoryStore.ts
import type { Category } from "$lib/types";
import { writable } from "svelte/store";

export const categories = writable<Category[]>([]);
export function setCategories(cats: Category[]) {
  categories.set(cats);
}

export function addCategory(newCat: Category) {
  categories.update((currentCats) => {
    if (!currentCats.some((cat) => cat.id === newCat.id)) {
      return [...currentCats, newCat];
    }
    return currentCats;
  });
}

export function removeCategory(id: string) {
  categories.update((currentCats) =>
    currentCats.filter((cat) => cat.id !== id)
  );
}

export function updateCategory(updatedCat: Category) {
  categories.update((currentCats) =>
    currentCats.map((cat) => cat.id === updatedCat.id ? updatedCat : cat)
  );
}

export function findCategory(id: string): Category | undefined {
  let found: Category | undefined = undefined;
  categories.subscribe((cats) => {
    found = cats.find((cat) => cat.id === id);
  })();
  return found;
}

export function getCategoriesSnapshot(): Category[] {
  let snapshot: Category[] = [];
  categories.subscribe((cats) => {
    snapshot = cats;
  })();
  return snapshot;
}

export function setCategoryVisible(id: string, visible: boolean) {
  categories.update((cats) =>
    cats.map((cat) => (cat.id === id ? { ...cat, visible } : cat))
  );
}
