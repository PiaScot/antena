// src/lib/stores/siteStore.ts
import type { Site } from "$lib/types";
import { writable } from "svelte/store";

export const sites = writable<Site[]>([]);
export function setSites(newSites: Site[]) {
  sites.set(newSites);
}
export function addSite(newSite: Site) {
  sites.update((currentSites) => {
    if (!currentSites.some((site) => site.id === newSite.id)) {
      return [...currentSites, newSite];
    }
    return currentSites;
  });
}

export function removeSite(id: number) {
  sites.update((currentSites) => currentSites.filter((site) => site.id !== id));
}

export function updateSite(updatedSite: Site) {
  sites.update((currentSites) =>
    currentSites.map((site) => site.id === updatedSite.id ? updatedSite : site)
  );
}

export function findSite(id: number): Site | undefined {
  let found: Site | undefined = undefined;
  sites.subscribe((siteList) => {
    found = siteList.find((site) => site.id === id);
  })();
  return found;
}

export function getSitesSnapshot(): Site[] {
  let snapshot: Site[] = [];
  sites.subscribe((siteList) => {
    snapshot = siteList;
  })();
  return snapshot;
}
