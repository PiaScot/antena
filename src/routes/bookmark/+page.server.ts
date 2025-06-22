//routes/bookmark/+page.server.ts
import { getBookmarks } from "$lib/api/db/bookmark";
import type { PageServerLoad } from "./$types";
import { error as svelteKitError } from "@sveltejs/kit";
import type { ArticleFeedItem, LoadPageData } from "$lib/types";

type BookmarkPageData = LoadPageData<ArticleFeedItem>;

export const load: PageServerLoad<BookmarkPageData> = async () => {
  try {
    const { bookmarks, count } = await getBookmarks();
    return {
      items: bookmarks,
      count: count,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error
      ? err.message
      : "An unknown error occurred";
    console.error(
      "Error loading bookmarks in /routes/bookmark/+page.server.ts:",
      errorMessage,
    );

    throw svelteKitError(500, "ブックマークの読み込みに失敗しました。");
  }
};
