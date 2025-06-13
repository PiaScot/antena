import { json, type RequestHandler } from "@sveltejs/kit";
import {
  deleteBookmark,
  getBookmark,
  getBookmarks,
  upsertBookmark,
} from "$lib/api/db/bookmark";
import type { Article } from "$lib/types";

export const GET: RequestHandler = async ({ url }) => {
  const id = url.searchParams.get("id");
  try {
    if (id) {
      const bookmarked = await getBookmark(id);
      // ★★★ 解決策: { isBookmarked: ... } というオブジェクトを返す ★★★
      return json({ isBookmarked: bookmarked });
    }

    const articles = await getBookmarks();
    return json({ articles }); // jsonヘルパーでラップ
  } catch (err: any) {
    console.error(err);
    return json({ error: err.message }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const article: Article = await request.json();
    const result = await upsertBookmark(article);
    return json({ ok: true, result });
  } catch (err: any) {
    return json({ error: err.message }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ url }) => {
  const id = url.searchParams.get("id");
  try {
    if (!id) {
      return json({ error: "id parameter is required" }, { status: 400 });
    }
    const result = await deleteBookmark(id);
    return json({ ok: true, result });
  } catch (err: any) {
    return json({ error: err.message }, { status: 500 });
  }
};
