import {
	loadAllCategories,
	loadSuperCategoryGroups
} from '$lib/api/db/category';
import { loadAllSites } from '$lib/api/db/site';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	try {
		const { sites } = await loadAllSites();
		const categories = await loadAllCategories();
		const superCategoryGroups = await loadSuperCategoryGroups();
		return {
			sites,
			categories,
			superCategoryGroups
		};
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('Layout data loading failed:', error);
		return {
			sites: [],
			categories: [],
			superCategoryGroups: [],
			error: error.message
		};
	}
};
