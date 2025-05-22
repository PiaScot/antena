import * as cheerio from "cheerio";
import fs from "node:fs";
import iconv from "iconv-lite";
import Encoding from "encoding-japanese";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import beautify from "js-beautify";
import { gotScraping } from "got-scraping";
import htmlEncodingSniffer from "html-encoding-sniffer";
import jschardet from "jschardet";
import whatwgEncoding from "whatwg-encoding";
const windowForPurify = new JSDOM("").window;
const DOMPurify = createDOMPurify(windowForPurify);

async function getHtmlText(articleUrl) {
	const resp = await gotScraping.get({
		url: articleUrl,
		responseType: "buffer",
	});

	const body = resp.body;
	const headers = resp.headers;
	let charset = "";
	const contentType = headers["content-type"];
	if (contentType) {
		const charsetMatch = contentType.match(`charset=(.*$)`);
		if (charsetMatch) {
			charset = charsetMatch[1];
		}
	}
	const buffer = new Uint8Array(body);
	const detected = Encoding.detect(body);
	let text;

	if (detected != "UNICODE") {
		console.log(`convert to UNICODE in Encoding.convert`);
		text = Encoding.convert(buffer, {
			from: detected,
			to: "UNICODE",
			type: "string",
		});
	} else {
		if (Buffer.isBuffer(body)) {
			console.log(`decode to ${charset}`);
			text = iconv.decode(body, charset);
		} else {
			text = body;
		}
	}
	text = removeDuplicateEmptyLine(text);
	return text;
}

function removeDuplicateEmptyLine(text) {
	return text.replace(/\n\s*\n+/g, "\n");
}

function removeTag(main, tags) {
	tags.forEach((tag) => main.find(tag).remove());
}

function transVisibleImage(main, $, tag = "p > a") {
	main.find(tag).each((_, a) => {
		const href = $(a).attr("href");
		if (href && href.match(/\.(jpg|jpeg|png|gif)$/i)) {
			const img = $("<img>").attr("src", href);
			$(a).replaceWith(img);
		}
	});
}

function img_datasrc_to_img_src(main, $, tag = "data-src") {
	main.find(`img[${tag}]`).each(function () {
		const dataSrc = $(this).attr(tag);
		$(this).attr("src", dataSrc); // Set src to data-src value
		$(this).removeAttr(tag); // Optionally remove data-src attribute
	});
}

function remove_empty_element(tag = "p", main, $) {
	main.find(tag).each(function () {
		const content = $(this).text().trim();
		if (!content) {
			$(this).remove(); // Remove if it's empty or contains only non-visible characters
		}
	});
}

function iframe_src_to_with_suffix_in_itemfix(main, $) {
	main.find("iframe").each((_, iframe) => {
		const src = $(iframe).attr("src");
		if (src && src.includes("itemfix.com")) {
			$(iframe).attr("src", "https:" + src);
		}
	});
}

function remove_affi_id_dmm_url(text) {
	return text.replace(/affi_id=[^/]+\//, "");
}

function convertSourceToVideo(main, $, tag) {
	main.find(tag).each((_, div) => {
		const source = $(div).find('source[type="video/mp4"]');
		if (source.length) {
			const src = source.attr("src");
			if (src) {
				$(div).prepend(`<video src="${src}" controls></video>`);
				source.remove();
			}
		}
		$(div).find("p.vjs-no-js").remove();
	});
}

// 対象となる動画コンテナをシンプルなvideoタグに置換する関数
function simplifyVideoElement(main, $, tag) {
	// 指定されたクラス名のdiv要素を対象とする
	main.find(tag).each((_, container) => {
		const $container = $(container);
		// <video> タグ内の <source> タグから src 属性を取得
		const source = $container.find('source[type="video/mp4"]');
		if (source.length) {
			const src = source.attr("src");
			if (src) {
				// コンテナ全体をシンプルな video タグに置換
				$container.replaceWith(`<video src="${src}" controls></video>`);
			}
		}
	});
}
/**
 * convertAnchorToImg
 *
 * 指定されたセレクタ（デフォルトは "a"）で見つかったアンカー要素の
 * href 属性が画像ファイル（拡張子 jpg, jpeg, png, gif など）で終わる場合、
 * 該当アンカーを <img> タグに置換します。
 *
 * @param {CheerioStatic} main - cheerio のルート要素（DOM ツリー）
 * @param {CheerioStatic} $ - cheerio のインスタンス
 * @param {string} [selector="a"] - 検索するセレクタ
 */
function convertAnchorToImg(main, $, selector = "a") {
	main.find(selector).each((_, elem) => {
		const href = $(elem).attr("href");
		// 拡張子にクエリパラメータが付いている場合にも対応
		if (href && href.match(/\.(jpg|jpeg|png|gif)(\?.*)?$/i)) {
			// title属性やテキスト（alt代わり）を必要に応じて取得
			const title = $(elem).attr("title") || "";
			const alt = $(elem).text().trim() || "";
			// imgタグを作成
			const img = $("<img>")
				.attr("src", href)
				.attr("alt", alt)
				.attr("title", title);
			$(elem).replaceWith(img);
		}
	});
}

/**
 * fixBase64ImgTag
 *
 * <img src="data:image/..." ...>
 * の形にマッチし、style と alt 属性を付与する。
 * 既に style や alt がある場合は上書きしない簡易実装。
 */
function fixBase64ImgTag(text) {
	// 正規表現:
	//  - (<img\s+[^>]*src="data:image/[^"]+"[^>]*)(>):
	//    先頭を $1, 閉じタグ手前を $2 としてキャプチャ
	//  - gi: 大文字小文字無視、複数行にわたって検索
	const pattern = /(<img\s+[^>]*src="data:image\/[^"]+"[^>]*)(>)/gi;

	// $1 と $2 の間に style と alt を挿入する
	return text.replace(
		pattern,
		'$1 style="width: 32px; height: 32px;" alt="emoji"$2',
	);
}

// 任意のタグを削除する関数
function remove_tag_as_string(text, tag) {
	// タグ名に基づき、動的に正規表現を生成（タグの開始～終了まで）
	const regex = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, "gi");
	return text.replace(regex, "");
}

// imgurのblockquoteタグをimgタグに変換する関数（data-id属性が存在する場合のみ）
function imgur_blockquote_to_img(text) {
	return text.replace(
		/<blockquote\s+data-id="([^"]+)"\s+class="imgur-embed-pub"><\/blockquote>/gi,
		(match, dataId) => `<img src="https://imgur.com/${dataId}.jpg">`,
	);
}

function base_extract(data, options) {
	if (!data) {
		console.log(`No data to be willing to extract`);
		return "";
	}

	if (!options.mainSelectorTag && !options.mainSelectorFunction) {
		console.log(
			`No specify main selector tag or main selector function in base_extract`,
		);
		return "";
	}
	const $ = cheerio.load(data);
	const sanitizedAddTags = options.sanitizedAddTags || ["iframe", "script"];
	const removeContents = options.removeSelectorTag || '[class*="ad"]';

	let main;
	if (options.mainSelectorTag) {
		main = $(options.mainSelectorTag);
	} else if (options.mainSelectorFunction) {
		main = options.mainSelectorFunction($);
	}

	main.find(removeContents).remove();

	if (options.visibleImage) {
		transVisibleImage(main, $, options.visibleImage);
	}
	if (options.removeEmptyTag) {
		remove_empty_element(options.removeEmptyTag, main, $);
	}

	if (options.img_datasrc_to_img_src) {
		img_datasrc_to_img_src(main, $, options.img_datasrc_to_img_src);
	}

	if (options.iframe_src_to_with_suffix_in_itemfix) {
		iframe_src_to_with_suffix_in_itemfix(main, $);
	}

	if (options.to_full_url) {
		main.find("[src]").each((_, elem) => {
			let src = $(elem).attr("src");
			if (src && !/^https?:\/\//i.test(src)) {
				// 先頭のスラッシュを取り除いてから "https://" を付加
				src = options.to_full_url + src.replace(/^\/+/, "");
				console.log(`src = ${src}`);
				$(elem).attr("src", src);
			}
		});
	}

	if (options.iframe_to_img_with_src) {
		main.find("iframe").each((_, iframe) => {
			const src = $(iframe).attr("src");
			if (src && src.includes("https://imgur.com")) {
				const img = $("<img>").attr("src", src);
				$(iframe).replaceWith(img);
			}
		});
	}

	if (options.removeEmptyTag) {
		main.find(options.removeEmptyTag).empty();
	}

	if (options.convertSourceToVideoTag) {
		convertSourceToVideo(main, $, options.convertSourceToVideoTag);
	}

	if (options.simplifyVideoElement) {
		simplifyVideoElement(main, $, options.simplifyVideoElement);
	}

	if (options.removeTag) {
		removeTag(main, options.removeTag);
	}

	if (options.convertAnchorToImg) {
		// options.convertAnchorToImg が true なら、デフォルトのセレクタ "a" で処理
		// もしくは、オブジェクトの場合はセレクタを指定できるように
		const anchorSelector =
			typeof options.convertAnchorToImg === "string"
				? options.convertAnchorToImg
				: "a";
		convertAnchorToImg(main, $, anchorSelector);
	}

	const clean = DOMPurify.sanitize(main.html(), {
		ADD_TAGS: sanitizedAddTags,
		ADD_ATTR: [
			"allow",
			"allowfullscreen",
			"frameborder",
			"scrolling",
			"mozallowfullscreen",
			"webkitallowscreen",
		],
	});
	let output = beautify.html(clean, { indent_size: 2 });

	if (options.reducebr) {
		output = output.replace(
			new RegExp(`(?:<br\\s*/?>\\s*){${options.reducebr},}`, "gi"),
			"<br>",
		);
	}

	if (options.removeAffiID) {
		output = remove_affi_id_dmm_url(output);
	}

	if (options.fixBase64ImgRegex) {
		output = fixBase64ImgTag(output);
	}

	if (options.imgurToImg) {
		output = imgur_blockquote_to_img(output);
	}

	if (options.removeTagStr) {
		output = remove_tag_as_string(output, options.removeTagStr);
	}

	output = removeDuplicateEmptyLine(output);
	if (options.debug) {
		console.log(output);
	}
	return output;
}

// ani-chat.net
function _ani_chat_extract(body) {
	return base_extract(body, {
		sanitizedAddTags: [],
		mainSelectorTag: "article",
		removeSelectorTag:
			'div.widget, picture, div.toc, div.idname2, aside, div.toc, [href*="dmm"], [class*="meta"]',
		visibleImage: true,
	});
}
