// src/routes/+layout.server.ts
import { supabase } from "$lib/server/supabase";
import { CATEGORY_TABLE, SITE_TABLE } from "$env/static/private";
import type { LayoutServerLoad } from "./$types";
import type { Category, Site } from "$lib/types";

export const load: LayoutServerLoad<
  { sites: Site[]; categories: Category[]; error?: string }
> = async () => {
  try {
    const { data: sites, error: siteError } = await supabase
      .from<Site>(SITE_TABLE)
      .select("*");

    if (siteError) throw siteError;
    if (!sites.length) throw new Error("No Found site data from db");

    const { data: categories, error: catError } = await supabase
      .from<Category>(CATEGORY_TABLE)
      .select("*");

    if (catError) throw catError;
    if (!categories.length) throw new Error("No Found category data from db");
    return {
      sites: sites ?? [],
      categories: categories ?? [],
    };
  } catch (error: any) {
    return {
      sites: [],
      categories: [],
      error: error.message,
    };
  }
};
