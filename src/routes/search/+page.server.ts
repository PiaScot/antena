import { loadAllArticles } from '$lib/api/db/article';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const articlesPromise = (() => {
		return loadAllArticles();
	})();

	return {
		streamed: {
			articles: articlesPromise.then((res) => res ?? [])
		}
	};
};
