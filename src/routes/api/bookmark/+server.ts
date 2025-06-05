import type { RequestHandler } from "@sveltejs/kit";
import { supabase } from "$lib/server/supabase";
import { BOOKMARK_TABLE } from "$env/static/private";
import {
  deleteBookmark,
  getBookmark,
  getBookmarks,
  upsertBookmark,
} from "$lib/api/db/bookmark";
import type { Article } from "$lib/types";

// --- ブックマーク取得 ---
export const GET: RequestHandler = async ({ url }) => {
  const id = url.searchParams.get("id");
  try {
    if (id) {
      const { bookmarked } = await getBookmark(id);
      return new Response(
        JSON.stringify({ bookmarked }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const { articles, count } = await getBookmarks();
    return new Response(JSON.stringify({ articles, count }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
      },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// --- ブックマーク登録・上書き ---
export const POST: RequestHandler = async ({ request }) => {
  try {
    const article: Article = await request.json();
    const ok = await upsertBookmark(article);
    return new Response(JSON.stringify(ok), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// --- ブックマーク削除 ---
export const DELETE: RequestHandler = async ({ url }) => {
  const id = url.searchParams.get("id");
  try {
    if (!id) {
      return new Response(
        JSON.stringify({ error: "id parameter is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const result = await deleteBookmark(id);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
