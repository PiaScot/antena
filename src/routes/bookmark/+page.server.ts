import { getBookmarks } from "$lib/api/db/bookmark";
import type { PageServerLoad } from "./$types";
import type { ArticleWithSiteName, LoadPageData } from "$lib/types";

type BookmarkPageData = LoadPageData<ArticleWithSiteName>;

export const load: PageServerLoad<BookmarkPageData> = async () => {
  try {
    const { bookmarks, count } = await getBookmarks();
    return {
      items: bookmarks,
      count: count,
    };
  } catch (error: any) {
    console.error(
      "Error loading bookmarks in /routes/bookmark/+page.server.ts:",
      error.message,
    );
    return {
      items: [],
      count: 0,
      error: error.message || "Failed to load bookmark data from db.",
    };
  }
};
