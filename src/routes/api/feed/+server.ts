// src/routes/api/feed/+server.ts
import type { RequestHandler } from "@sveltejs/kit";
import type { Article, Site } from "$lib/types";
import { supabase } from "$lib/server/supabase";
import { ARTICLE_TABLE } from "$env/static/private";

export const GET: RequestHandler = async ({ url }) => {
  const category = url.searchParams.get("category") || "all";

  try {
    let query = supabase
      .from<Article>(ARTICLE_TABLE)
      .select("*", { count: "exact" });

    if (category !== "all") {
      query = query.eq("category", category);
    }

    const { data: articles, count, error: fetchError } = await query
      .order("pub_date", { ascending: false });

    if (fetchError) {
      throw new Error(
        `Failed to fetch articles table name => ${ARTICLE_TABLE}`,
      );
    }

    if (!articles) {
      throw new Error(
        `WARN: Found 0 article from ${ARTICLE_TABLE}`,
      );
    }

    return new Response(JSON.stringify({ articles }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err }), {
      status: 500,
    });
  }
};
