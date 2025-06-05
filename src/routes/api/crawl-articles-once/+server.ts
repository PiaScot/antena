// src/routes/api/crawl-articles-once/+server.ts

// TODO
// find feels good free plan faas

import type { RequestHandler } from "@sveltejs/kit";
import { supabase } from "$lib/server/supabase";
import { ARTICLE_TABLE, SITE_TABLE } from "$env/static/private";
import type { Article } from "$lib/types";

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const siteID = data.siteID;
  const rawItems = data.rawArticles;
  let l = 0;

  // TODO
  // make auto scrape_options.mainSelectorTag
  for (const rawItem of rawItems) {
    rawItem.site_id = siteID;
    rawItem.content = await getContent(rawItem.link);
    rawItem.thumbnail = await setThumbnail(rawItem.content);

    const { id, ...article } = rawItem;
    const { error } = await supabase.from(ARTICLE_TABLE).insert(article);
    l += 1;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, length: l }), { status: 200 });
};
