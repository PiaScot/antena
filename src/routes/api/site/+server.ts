import { json, type RequestHandler } from "@sveltejs/kit";
import {
  fetchSiteInfoFromRSS,
  isRegistered,
  loadAllSites,
  loadSiteByDomain,
  registerSite,
  updateSiteInDB,
} from "$lib/api/db/site";
import { getDomain } from "$lib/utils";
import type { Site } from "$lib/types";

// --- GET --- サイト単体 or 一覧
export const GET: RequestHandler = async ({ url }) => {
  try {
    const inputUrl = url.searchParams.get("url");

    if (inputUrl) {
      // ドメイン指定検索
      const domain = getDomain(inputUrl);
      if (!domain) {
        return json({ error: `不正なURLです: ${inputUrl}` }, { status: 400 });
      }
      const site = await loadSiteByDomain(domain);
      return json({ site });
    } else {
      // サイト一覧全件
      const { sites, count } = await loadAllSites();
      return json({ sites, count });
    }
  } catch (error: any) {
    console.error("Error fetching sites:", error);
    return json({ error: error?.message ?? "Internal Server Error" }, {
      status: 500,
    });
  }
};

// --- POST --- サイト新規登録 or RSS解析だけ
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    if (body.action === "fetch-site-info") {
      const { url, category } = body;
      if (!url || !category) {
        return json({ error: "URLとカテゴリは必須です" }, { status: 400 });
      }
      return await handleFetchSiteInfo(url, category);
    }

    // 通常の新規登録
    return await handleRegisterSite(body);
  } catch (error: any) {
    console.error("Invalid POST request:", error);
    return json({ error: "リクエストの形式が正しくありません。" }, {
      status: 400,
    });
  }
};

// --- PATCH --- サイト編集
export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return json({ error: "IDが指定されていません" }, { status: 400 });
    }

    const updatedSite = await updateSiteInDB(id, updateData);
    return json({ ok: true, site: updatedSite });
  } catch (err: any) {
    console.error("Site update failed:", err);
    return json({ error: err?.message || "更新失敗" }, { status: 500 });
  }
};

// --- 補助関数 ---

async function handleFetchSiteInfo(url: string, category: string) {
  try {
    if (await isRegistered(url)) {
      return json({ error: "このサイトは既に登録済みです" }, { status: 409 }); // 409 Conflict
    }
    const result = await fetchSiteInfoFromRSS(url, category);
    return json(result);
  } catch (err: any) {
    return json({ error: err?.message || "RSS取得失敗" }, { status: 500 });
  }
}

async function handleRegisterSite(siteData: Omit<Site, "id">) {
  try {
    const result = await registerSite(siteData);
    if (result.ok && result.site) {
      return json({ ok: true, site: result.site }, { status: 201 }); // 201 Created
    }
    return json({ error: result.error }, { status: 400 });
  } catch (err: any) {
    return json({ error: err?.message || "登録失敗" }, { status: 500 });
  }
}
