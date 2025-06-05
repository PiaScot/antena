// /src/routes/api/fetch-site-info/+server.ts
import type { RequestHandler } from "@sveltejs/kit";
import { XMLParser } from "fast-xml-parser";
import { getDomain } from "$lib/utils";
import { randomPCUA } from "$lib/utils";
import { supabase } from "$lib/server/supabase";
import { SITE_TABLE } from "$env/static/private";
import type { ArticleWithSiteName, Site } from "$lib/types";

const parser = new XMLParser();

async function isRegistered(domain: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(SITE_TABLE)
    .select("id")
    .or(`domain.eq.${domain}`)
    .limit(1);
  if (error) {
    console.error("[querySiteTable]", error);
    return false;
  }
  return !!(data && data.length > 0);
}

async function determineRSS(top: string): Promise<string> {
  const feedUrls = [
    new URL("feed", top).toString(),
    new URL("index.rdf", top).toString(),
  ];

  for (const url of feedUrls) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok) {
        return url;
      }
    } catch (e) {
      console.log(e);
    }
  }
  return "";
}

export const POST: RequestHandler = async ({ request }) => {
  const { url, category } = await request.json();

  const domain = getDomain(url);
  const isAlreadyRegistered = await isRegistered(domain);
  if (isAlreadyRegistered) {
    const msg = `already register this site => ${url}`;
    console.warn(`[register] already exists: ${url}`);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rss = await determineRSS(url);
  if (rss === "") {
    const msg =
      `rss empty value. cannot find rss site from determine(url = ${url})`;
    console.warn(`[determine] empty rss value: ${url}`);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const resp = await fetch(rss, {
      headers: { "User-Agent": randomPCUA() },
      method: "GET",
    });
    const text = await resp.text();
    const xml = parser.parse(text);
    const chan = xml.rss?.channel ?? xml["rdf:RDF"]?.channel ?? xml.feed;
    const items = xml?.rss?.item || xml["rdf:RDF"]?.item || chan?.item || [];
    const siteTitle = chan?.title ?? "";

    const articles: ArticleWithSiteName[] = [];
    let duration_access = -1;

    const pubDates: number[] = [];
    for (const item of items) {
      const link = item.link?.split("?")[0] ?? "";
      const title = item.title ?? "";
      const pubDate = item.pubDate ?? item["dc:date"] ?? "";

      const dt = Date.parse(pubDate);
      if (!Number.isNaN(dt)) pubDates.push(dt);

      const article: ArticleWithSiteName = {
        id: -1,
        site_id: -1,
        title,
        site_title: siteTitle,
        url: link,
        category,
        thumbnail: "",
        pub_date: pubDate,
        content: "",
      };
      articles.push(article);
    }
    pubDates.sort((a, b) => b - a);
    if (pubDates.length >= 2) {
      // 隣接ペアごとの差分（秒）をすべて計算
      const gaps: number[] = [];
      for (let i = 0; i < pubDates.length - 1; i++) {
        const gap = Math.abs(pubDates[i] - pubDates[i + 1]) / 1000; // 秒単位
        if (gap > 0) gaps.push(gap);
      }
      // 平均値
      if (gaps.length > 0) {
        duration_access = Math.floor(
          gaps.reduce((sum, v) => sum + v, 0) / gaps.length,
        );
        // 5分未満や極端な値は10分（600秒）に補正
        if (duration_access < 300) duration_access = 600;
      } else {
        duration_access = 600;
      }
    } else if (pubDates.length === 1) {
      duration_access = 600;
    } else {
      duration_access = 1800;
    }

    const site: Site = {
      id: -1,
      url,
      title: siteTitle,
      rss,
      category,
      domain,
      last_access: "-1",
      duration_access,
      scrape_options: {},
    };

    return new Response(JSON.stringify({ site, articles }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `取得失敗: ${err}` }), {
      status: 500,
    });
  }
};
