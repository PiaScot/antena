// src/routes/articles/[id]/+page.server.ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { FullArticleData } from '$lib/types';

type ApiArticleResponse = {
  article: FullArticleData;
  isBookmarked: boolean;
};

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { id } = params;

  try {
    const res = await fetch(`/api/articles/${id}`);

    if (!res.ok) {
      throw error(res.status, `記事の取得に失敗しました: ${res.statusText}`);
    }

    const data = (await res.json()) as ApiArticleResponse;

    return {
      article: data.article,
      isBookmarked: data.isBookmarked
    };
  } catch (err) {
    console.error('Failed to load article:', err);
    throw error(500, '記事の読み込み中にサーバーエラーが発生しました');
  }
};
