import { supabase } from "$lib/server/supabase";
import { ARTICLE_TABLE, SITE_TABLE } from "$env/static/private";
import type { ArticleWithSiteName, Site } from "$lib/types";
import { XMLParser } from "fast-xml-parser";
import { getDomain, randomPCUA } from "$lib/utils";

/**
 * すべてのサイトを件数付きで取得します。
 * @returns {Promise<{ sites: Site[], count: number }>} サイトの配列と総件数
 */
export async function loadAllSites(): Promise<
  { sites: Site[]; count: number }
> {
  const { data, error, count } = await supabase
    .from(SITE_TABLE)
    .select("*", { count: "exact" });

  if (error) {
    console.error("Failed to load all sites:", error);
    throw error;
  }

  return { sites: data ?? [], count: count ?? 0 };
}

/**
 * 指定ドメインのサイトを1件取得
 */
export async function loadSiteByDomain(domain: string): Promise<Site | null> {
  const { data, error } = await supabase
    .from(SITE_TABLE)
    .select("*")
    .eq("domain", domain)
    .limit(1)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error(`Failed to load site by domain (${domain}):`, error);
      throw error;
    }
  }
  return data;
}

/**
 * 新規サイトを登録します。
 * @param site - idを除いたサイト情� �
 * @returns {Promise<{ ok: boolean; site?: Site; error?: string }>}
 */
export async function registerSite(
  site: Omit<Site, "id">,
): Promise<{ ok: boolean; site?: Site; error?: string }> {
  const { data, error } = await supabase
    .from(SITE_TABLE)
    .insert(site)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, site: data };
}

/**
 * サイト情� �を更新します。
 * @param id - 更新対象のサイトID
 * @param updates - 更新するサイト情� � (部分的な更新も可能)
 * @returns {Promise<Site>} 更新後のサイト情� �
 */
export async function updateSiteInDB(
  id: number,
  updates: Partial<Omit<Site, "id">>,
): Promise<Site> {
  const { data, error } = await supabase
    .from(SITE_TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Failed to update site (id: ${id}):`, error);
    throw error;
  }
  return data;
}

/**
 * RSSフィードからサイト情� �と最新記事を取得します。
 */
export async function fetchSiteInfoFromRSS(
  url: string,
  category: string,
): Promise<{
  site: Site;
  articles: ArticleWithSiteName[];
}> {
  const domain = getDomain(url);
  const rss = await determineRSS(url);
  if (!rss) throw new Error("RSSフィードが見つかりません");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const resp = await fetch(rss, {
    headers: { "User-Agent": randomPCUA() },
    method: "GET",
  });
  if (!resp.ok) throw new Error(`Failed to fetch RSS feed: ${resp.statusText}`);

  const text = await resp.text();
  const xml = parser.parse(text);

  const chan = xml.rss?.channel ?? xml["rdf:RDF"]?.channel ?? xml.feed;
  if (!chan) throw new Error("有効なチャンネルまたはフィードが見つかりません");

  const siteTitle =
    (typeof chan.title === "object" ? chan.title["#text"] : chan.title) || "";
  const items = Array.isArray(chan.item)
    ? chan.item
    : (chan.item
      ? [chan.item]
      : (Array.isArray(chan.entry)
        ? chan.entry
        : (chan.entry ? [chan.entry] : [])));

  const articles: ArticleWithSiteName[] = items.map((item) => {
    const link = item.link?.href ?? item.link ?? "";
    const pubDate = item.pubDate ?? item.published ?? item["dc:date"] ??
      new Date().toISOString();
    return {
      id: -1,
      site_id: -1,
      title: item.title ?? "",
      site_title: siteTitle,
      url: link.split("?")[0],
      category,
      thumbnail: "",
      pub_date: pubDate,
      content: "",
    };
  });

  const pubDates = articles.map((a) => Date.parse(a.pub_date)).filter((d) =>
    !isNaN(d)
  );
  const duration_access = calcDurationAccess(pubDates);

  const site: Site = {
    id: -1,
    url,
    title: siteTitle,
    rss,
    category,
    domain,
    last_access: new Date().toISOString(),
    duration_access,
    scrape_options: {},
  };

  return { site, articles };
}

// ---------- 補助関数 ----------

/** そのドメインが既に登録済みか（API用途） */
export async function isRegistered(url: string): Promise<boolean> {
  const domain = getDomain(url);
  const { error, count } = await supabase
    .from(SITE_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("domain", domain);

  if (error) {
    console.error("[isRegistered]", error);
    return false;
  }
  return (count ?? 0) > 0;
}

/** RSSの推定 */
export async function determineRSS(top: string): Promise<string> {
  const candidates = ["feed", "rss", "atom.xml", "index.rdf", "feed.xml"];
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate, top).toString();
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return url;
    } catch (e) { /* ignore */ }
  }
  return "";
}

/** 記事配列から平均更新間隔（秒）推定 */
export function calcDurationAccess(pubDates: number[]): number {
  const defaultDuration = 3600; // 1時間
  if (pubDates.length < 2) return defaultDuration;

  pubDates.sort((a, b) => b - a);
  const gaps = [];
  for (let i = 0; i < pubDates.length - 1; i++) {
    const gap = (pubDates[i] - pubDates[i + 1]) / 1000;
    if (gap > 0) gaps.push(gap);
  }

  if (gaps.length === 0) return defaultDuration;

  const averageGap = gaps.reduce((sum, v) => sum + v, 0) / gaps.length;
  return Math.floor(averageGap);
}
