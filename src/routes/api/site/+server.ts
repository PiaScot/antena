import {
	deleteSiteInDB,
	fetchSiteInfoFromRSS,
	isRegistered,
	loadAllSites,
	loadSiteByDomain,
	registerSite,
	updateSiteInDB
} from '$lib/api/db/site';
import type { Article, Site } from '$lib/types';
import { getDomain } from '$lib/utils';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const inputUrl = url.searchParams.get('url');

		if (inputUrl) {
			const domain = getDomain(inputUrl);
			if (!domain) {
				return json({ error: `不正なURLです: ${inputUrl}` }, { status: 400 });
			}
			const site = await loadSiteByDomain(domain);
			return json({ site });
		} else {
			const { sites, count } = await loadAllSites();
			return json({ sites, count });
		}
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('Error fetching sites:', error);
		return json(
			{ error: error.message ?? 'Internal Server Error' },
			{
				status: 500
			}
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (body.action === 'fetch-site-info') {
			const { url, rssUrl, category } = body;
			if (!url || !rssUrl || !category) {
				return json(
					{ error: 'サイトURL, RSSフィードURL, カテゴリは必須です' },
					{ status: 400 }
				);
			}
			return await handleFetchSiteInfo(url, rssUrl, category);
		}

		return await handleRegisterSite(body);
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('Invalid POST request:', error);
		return json(
			{ error: 'リクエストの形式が正しくありません。' },
			{
				status: 400
			}
		);
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { id, ...updateData } = body;

		if (!id) {
			return json({ error: 'IDが指定されていません' }, { status: 400 });
		}

		const updatedSite = await updateSiteInDB(id, updateData);
		return json({ ok: true, site: updatedSite });
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('Site update failed:', error);
		return json({ error: error.message || '更新失敗' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const id = url.searchParams.get('id');
		if (!id) {
			return json({ error: 'サイトIDは必須です' }, { status: 400 });
		}

		await deleteSiteInDB(Number(id));
		return json({ ok: true });
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('Site deletion failed:', error);
		return json({ error: error.message }, { status: 500 });
	}
};

async function handleFetchSiteInfo(
	url: string,
	rssUrl: string,
	category: string
) {
	try {
		if (await isRegistered(url)) {
			return json({ error: 'このサイトは既に登録済みです' }, { status: 409 });
		}
		const result = await fetchSiteInfoFromRSS(url, rssUrl, category);
		return json(result);
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		return json({ error: error.message || 'RSS取得失敗' }, { status: 500 });
	}
}

/**
 * サイトと記事をDBに登録する処理を呼び出します。
 * @param payload - フロントエンドから送信されたサイト情報と記事リスト
 */
async function handleRegisterSite(payload: {
	site: Omit<Site, 'id'>;
	articles: Article[] | null;
}) {
	try {
		const { site, articles } = payload;

		if (!site || !site.url) {
			return json({ error: 'サイト情報が不正です' }, { status: 400 });
		}
		const result = await registerSite(site, articles);
		if (result.ok && result.site) {
			return json({ site: result.site }, { status: 201 });
		} else {
			return json(
				{ error: result.error || '登録に失敗しました' },
				{
					status: 409
				}
			);
		}
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		console.error('登録処理のハンドル中にエラーが発生しました:', error);
		return json(
			{ error: '登録処理中に予期せぬサーバーエラーが発生しました' },
			{
				status: 500
			}
		);
	}
}
