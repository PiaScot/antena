import { supabase } from "$lib/server/supabase";
import { ARTICLE_TABLE, SITE_TABLE } from "$env/static/private";
import type { Article, Site } from "$lib/types";
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
 * 新規サイトを登録し、同時にRSSから取得した記事もDBに保存します。
 * @param site - idを除いたサイト情報
 * @param articles - 登録する記事情報の配列
 * @returns {Promise<{ ok: boolean; site?: Site; error?: string }>}
 */
export async function registerSite(
  site: Omit<Site, "id">,
  articles: Article[] | null,
): Promise<{ ok: boolean; site?: Site; error?: string }> {
  const { data: newSite, error: siteError } = await supabase
    .from(SITE_TABLE)
    .insert(site)
    .select()
    .single();

  if (siteError) {
    console.error("Supabase site insert error:", siteError);
    if (siteError.code === "23505") {
      return {
        ok: false,
        error: "このサイトのURLまたはRSSは既に登録されています。",
      };
    }
    return { ok: false, error: "サイトのデータベース登録に失敗しました。" };
  }

  if (!newSite) {
    return { ok: false, error: "サイト登録後のデータ取得に失敗しました。" };
  }

  if (articles && articles.length > 0) {
    // 【★★★ ここを修正しました ★★★】
    const articlesToInsert = articles.map((article) => {
      // 分割代入を使い、`article`オブジェクトから`id`と`site_id`を取り除く。
      // そして、残りのプロパティを `rest` という新しいオブジェクトに集める。
      const { id, site_id, ...rest } = article;

      // `id`が含まれていない`rest`を展開し、正しい`site_id`などを設定する。
      return {
        ...rest,
        pub_date: new Date(article.pub_date),
        site_id: newSite.id,
      };
    });

    const { error: articleError } = await supabase
      .from(ARTICLE_TABLE)
      .insert(articlesToInsert); // idを含まないオブジェクトの配列を渡す

    if (articleError) {
      console.error("Supabase article insert error:", articleError);

      await supabase.from(SITE_TABLE).delete().eq("id", newSite.id);

      if (articleError.code === "23505") {
        return {
          ok: false,
          error:
            `記事の登録に失敗しました。ユニーク制約違反: ${articleError.details}`,
        };
      }
      return {
        ok: false,
        error: "記事の登録に失敗したため、サイト登録を中止しました。",
      };
    }
  }

  return { ok: true, site: newSite as Site };
}

/**
 * サイト情報を更新します。
 * @param id - 更新対象のサイトID
 * @param updates - 更新するサイト情報 (部分的な更新も可能)
 * @returns {Promise<Site>} 更新後のサイト情報
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
 * RSSフィードからサイト情報と最新記事を取得します。
 */
export async function fetchSiteInfoFromRSS(
  siteUrl: string,
  rssUrl: string,
  category: string,
): Promise<{
  site: Omit<Site, "id">;
  articles: Article[];
}> {
  const domain = getDomain(siteUrl);

  // ★★★ 2. パーサーにオプションを追加し、テキストの変換を防ぐ ★★★
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    // このオプションで、HTMLエンティティ（例: &#x30DE;）を
    // 元の文字（例: 「マ」）に強制的にデコードします。
    htmlEntities: true,
  });

  const resp = await fetch(rssUrl, {
    headers: { "User-Agent": randomPCUA() },
    method: "GET",
  });
  if (!resp.ok) {
    throw new Error(`RSSフィードの取得に失敗しました: ${resp.statusText}`);
  }

  const xml = parser.parse(await resp.text());
  // RSS 1.0 (rdf:RDF) と RSS 2.0 (rss), Atom (feed) の各形式に対応
  const root = xml["rdf:RDF"] ?? xml.rss ?? xml;
  const chan = root.channel ?? root.feed;

  if (!chan) throw new Error("有効なRSSフィードの形式ではありません");

  // textNodeNameオプションにより、常にオブジェクトの #text プロパティとして値が取得できる
  const siteTitle = chan.title?.["#text"] || domain;

  // ★★★ 1. 記事リストの取得ロジックを修正 ★★★
  // RSS 1.0 では <rdf:RDF> 直下、RSS 2.0/Atomでは <channel> 直下にある item/entry を取得
  let items = root.item ?? chan.item ?? chan.entry ?? [];
  // 記事が1件の場合でも配列として扱えるようにする
  if (!Array.isArray(items)) {
    items = [items];
  }

  const articles: Article[] = items.map((item: any) => {
    const link = item.link?.["#text"] ?? item.link?.href ?? item.link ?? "";
    const pubDate = item.pubDate?.["#text"] ?? item.published?.["#text"] ??
      item["dc:date"] ??
      new Date().toISOString();
    const title = item.title?.["#text"] ?? item.title ?? "";

    return {
      id: -1,
      site_id: -1,
      title: title,
      url: link.split("?")[0],
      category: category,
      thumbnail: item["hatena:imageurl"]?.["#text"] ?? "", // はてな固有のサムネイルURLを取得
      pub_date: pubDate,
      content: item.description?.["#text"] ?? "", // descriptionも取得しておく
    };
  });

  const pubDates = articles.map((a) => Date.parse(a.pub_date)).filter((d) =>
    !Number.isNaN(d)
  );
  const duration_access = calcDurationAccess(pubDates);

  const site: Omit<Site, "id"> = {
    url: siteUrl,
    title: siteTitle,
    rss: rssUrl,
    category,
    domain,
    last_access: new Date().toISOString(),
    duration_access,
    scrape_options: { removeSelectorTags: [], display_mode: "direct_link" },
  };

  return { site, articles };
}

/**
 * 指定されたIDのサイトを削除します。
 * DBにON DELETE CASCADEが設定されていれば、関連する記事も自動的に削除されます。
 * @param id - 削除するサイトのID
 */
export async function deleteSiteInDB(id: number): Promise<void> {
  const { error } = await supabase
    .from(SITE_TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Failed to delete site (id: ${id}):`, error);
    // 外部キー制約違反などのDBエラーを呼び出し元にスローする
    throw error;
  }
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

/** 記事配列から平均更新間隔（秒）を推定 */
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
