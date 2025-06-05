// src/routes/api/register-site/+server.ts
import type { RequestHandler } from "@sveltejs/kit";
import { supabase } from "$lib/server/supabase";
import { SITE_TABLE } from "$env/static/private";
import type { Site } from "$lib/types";

export const POST: RequestHandler = async ({ request }) => {
  const site: Site = await request.json();
  const d = new Date();
  site.last_access = d.toISOString();

  // TODO
  // make auto scrape_options.mainSelectorTag

  const { data, error } = await supabase.from(SITE_TABLE).insert([site]).select(
    "id",
  ).limit(1);
  const id = data?.[0]?.id;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
  return new Response(JSON.stringify({ ok: true, id }), { status: 200 });
};
