// src/routes/api/page/+server.ts
import type { RequestHandler } from "@sveltejs/kit";
import { supabase } from "$lib/server/supabase";
import { SITE_TABLE } from "$env/static/private";
import type { Site } from "$lib/types";

export const GET: RequestHandler = async () => {
  const { data, error } = await supabase
    .from<Site>(SITE_TABLE)
    .select("url, domain, title, category, last_access");

  if (error) {
    console.error("Error fetching sites:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 },
    );
  }

  return new Response(JSON.stringify({ sites: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
