import * as cheerio from "cheerio";
import fs from "node:fs";
import iconv from "iconv-lite";
import Encoding from "encoding-japanese";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import beautify from "js-beautify";
import { gotScraping } from "got-scraping";

const windowForPurify = new JSDOM("").window;
const DOMPurify = createDOMPurify(windowForPurify);

async function getHtmlText(articleUrl: string) {
  const resp = await gotScraping.get({
    url: articleUrl,
    responseType: "buffer",
  });

  const body = resp.body;
  const headers = resp.headers;
  let charset = "";
  const contentType = headers["content-type"];
  if (contentType) {
    const charsetMatch = contentType.match("charset=(.*$)");
    if (charsetMatch) {
      charset = charsetMatch[1];
    }
  }
  const buffer = new Uint8Array(body);
  const detected = Encoding.detect(body);
  let text: string;

  if (detected !== "UNICODE") {
    console.log("convert to UNICODE in Encoding.convert");
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

function removeDuplicateEmptyLine(text: string): string {
  return text.replace(/\n\s*\n+/g, "\n");
}

function removeTag(main: cheerio.Cheerio, tags: string) {
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
  main.find(`img[${tag}]`).each(function() {
    const dataSrc = $(this).attr(tag);
    $(this).attr("src", dataSrc); // Set src to data-src value
    $(this).removeAttr(tag); // Optionally remove data-src attribute
  });
}

function remove_empty_element(tag = "p", main, $) {
  main.find(tag).each(function() {
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

// korewaeroi.com
function _korewaeroi_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "section.content",
    removeSelectorTag: "div.yarpp",
  });
}

// 1000dobu.com
function _1000dobu_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "section.content",
    removeSelectorTag: "div.wp-rss-template-container",
    sanitizedAddTags: ["iframe"],
  });
}

// 1000mg.jp
function _1000mg_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-outer-3",
    removeSelectorTag:
      'div.index_toolbox, div[class*="smnrela"], h3.h2, div.article-tags, div.single_bottom, div[id="article-options"], div.navigation, div[style="margin-bottom:8px;"],div.wp-rss-template-container',
    sanitizedAddTags: ["iframe", "script"],
  });
}
// 2ch-ero-report-blog.jp
function _2ch_ero_report_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      '[class^=ninja], [class^=ldblog], [style^=display], [href*="ac.ms-track.info"]',
    sanitizedAddTags: ["iframe"],
    reducebr: 3,
  });
}

// 5ch-echiechi.doorblog.jp
function _5ch_echiechi_doorblog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.ently_body",
    removeSelectorTag:
      "div.kijinakakoteeei, div.entry-wrap, h3.midasih3, div[id=pickup], div.dmmmm, div.ssnnss, br",
    sanitizedAddTags: ["iframe"],
  });
}

// 2chav.com
function _2chav_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.ently_body",
    removeSelectorTag:
      "div.kijinakakoteeei, div.entry-wrap, h3.midasih3, div[id=pickup], div.dmmmm, div.ssnnss, br",
    sanitizedAddTags: ["iframe"],
  });
}

// bakuwaro
function _bakuwaro_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag:
      "div.wp_social_bookmarking_light, br, footer, [class*=widget], div.im_w_wrap",
    removeEmptyTag: "p",
    img_datasrc_to_img_src: true,
  });
}

// lucky318b.com
function _lucky318b_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content > table",
    removeSelectorTag:
      "div[id=article-over], div.wp-rss-template-container, br",
    sanitizedAddTags: ["iframe"],
    removeEmptyTag: "p",
  });
}
// hiroiro.com
function _hiroiro_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    sanitizedAddTags: ["iframe", "script"],
  });
}

// jumpsokuhou.blog.jp
function _jumpsokuhou_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      "div[class*=ad], div[id^=blz_rss], div.article-body-more > blockquote, br, span",
    sanitizedAddTags: ["iframe"],
    removeEmptyTag: "p",
  });
}

// pokemon-goh.doorblog.jp
function _pokemon_goh_doorblog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag: "dl.article-tags, br",
    sanitizedAddTags: ["iframe"],
  });
}

// openworldnews.net
function _openworldsnews_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "article[id=entryarea]",
    removeSelectorTag:
      "table.abox, ul[id=shareBtns], p[id=taxsonomy], div.amazon",
    sanitizedAddTags: ["iframe", "script"],
    removeEmptyTag: "p",
  });
}

// www.shock-tv.com
function _shock_tv_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    sanitizedAddTags: ["iframe", "script"],
    iframe_src_to_with_suffix_in_itemfix: true,
  });
}

// you1news.com
function _you1news_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body",
    removeSelectorTag: "ins.adsbygoogle, br",
    sanitizedAddTags: ["iframe", "script"],
  });
}

// vippers.jp
function _vippers_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.articleBody",
    removeSelectorTag: "div[id^=ad], div[class^=include], div.clearfix, br",
  });
}

// zch-vip.com
function _zch_vip_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body",
    removeSelectorTag:
      "div[id*=ad], div[class^=include], div[id^=ldblog_related], div.clearfix, div.smf, ul.article_bottom, br",
    sanitizedAddTags: ["iframe"],
    removeEmptyTag: "div",
  });
}

// mashlife.doorblog.jp
function _mashlife_doorblog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body",
    removeSelectorTag:
      '[id*=ad], [class*=ad], [summary*=ad], div[class^=include], div[id^=ldblog_related], \
        div.ninja-recommend-block, div.clearfix, div.koteigazo2, ul.article_bottom, div[class^=blogroll-wrapper], \
        section[id=comments], [href*=ldapp_notifier], [class*=button], br, b, [href*="2ch-c.net"], [href*="feedly.com"',
  });
}

// moez-m.com
function _moez_m_extract(body) {
  return base_extract(body, {
    mainSelectorFunction: ($) => {
      return $("h6")
        .filter((_, el) => $(el).text().trim() == "今日の更新画像")
        .next("p");
    },
    visibleImage: "a",
    sanitizedAddTags: [],
  });
}

// www.watch2.chan.com
function _watch2_chan_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    sanitizedAddTags: [],
  });
}

// asianoneta.blog.jp
function _asianoneta_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry_articles_main",
    removeSelectorTag:
      ', div.headline_outline, div[id*="blz_rss"], div[class*="ninja"], div[class*="ad"], div.article-option, div.comment_title, div.comment_send, div.top_menu_title, div.article_title_bar, div.entry_articles, div.clearfix, div.smf, ul.article_bottom',
    sanitizedAddTags: ["iframe"],
  });
}

// aramame.net
function _aramame_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "article.article-large",
    removeSelectorTag:
      'div.article-body-before, aside.article-body-middle div[class*="rss"], div[class*="kes"], aside.article-body-middle, div.article-cat-list, section,s-wrapper-single',
    sanitizedAddTags: ["iframe"],
  });
}

// iroironetnews.blog.jp
function _iroironetnews_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.articles.body-inner",
    sanitizedAddTags: [],
  });
}

// usi32.com
function _usi32_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.articles.body-inner",
    removeSelectorTag:
      "div[class*=ad], div[id^=blz_rss], div.article-body-more > blockquote, br, span",
    sanitizedAddTags: [],
  });
}

// hheaven.jp
function _hheaven_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag:
      "div[class*=ad], div[id^=blz_rss], div[id*=custom_html], div.article-body-more > blockquote, br, span",
    sanitizedAddTags: [],
  });
}

// hnalady.com
function _hnalady_extract(body) {
  return base_extract(body, {
    mainSelectorFunction: ($) => {
      return $("div.entry_body").add($("div[id=more]"));
    },
    removeSelectorTag:
      "div.wakupr, h4.mine-title, div.relation_entry, h3.entry-bottom",
    sanitizedAddTags: [],
  });
}

// suitjoshi.com
function _suitjoshi_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body",
    removeSelectorTag: "div[class*=button]",
    sanitizedAddTags: [],
  });
}

// www.hdouga.com
function _hdouga_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.post_content",
    removeSelectorTag: 'div[class*="yarpp"], div.flex_box',
    sanitizedAddTags: [],
  });
}

// www.oumaga-times.com
function _oumaga_times_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag: 'div[class*="ad"], div[id^="blz_rss"]',
    sanitizedAddTags: [],
  });
}

// oshirigazo.com
function _oshirigazo_extract(body) {
  return base_extract(body, {
    mainSelectorFunction: ($) => {
      return $("div.entry-content").add($("div.eye-catch-wrap"));
    },
    removeSelectorTag: 'div[class*="ad"], div[id^="blz_rss"]',
    sanitizedAddTags: [],
  });
}

// onihimechan.com
function _onihimechan_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      "div[class*=ad], div[id^=blz_rss], div.foot_con, div[id^=ldblog], dl.article-tags",
    sanitizedAddTags: [],
  });
}

// crx7601.com sankaku
function _crx7601_extract(body) {
  return base_extract(body, {
    mainSelectorFunction: ($) => {
      return $("div.article-body-inner").add($("div.article-body-more"));
    },
    removeSelectorTag:
      "div[class*=ad], div[id^=blz_rss], div.foot_con, div[id^=ldblog], dl.article-tags, div[class*=box], [class*=ninja], ul.pr1",
    sanitizedAddTags: ["iframe"],
  });
}

// bakufu.jp
function _bakufu_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag:
      "table, ul.comments-link, div[class*=ad], div[id^=blz_rss], p, div.foot_con, div[id^=ldblog], dl.article-tags, div[class*=box], [class*=ninja], ul.pr1",
    sanitizedAddTags: ["iframe"],
  });
}

// oryouri.2chblog.jp
function _oryouri_2chblog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      "table, ul.comments-link, div[class*=ad], div[id^=blz_rss], p.contents_rss_text, div.contents_rss, div.amazon, style, div[id^=ldblog], dl.article-tags, div[class*=box], [class*=ninja], ul.pr1",
    sanitizedAddTags: ["iframe"],
  });
}

// www.otonarisoku.com
function _otonarisoku_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      "table, ul.comments-link, div[class*=ad], div[id^=blz_rss], p.contents_rss_text, div.contents_rss, div.amazon, style, div[id^=ldblog], dl.article-tags, div[class*=box], [class*=ninja], ul.pr1",
    sanitizedAddTags: ["iframe"],
  });
}

// ganmodoki.net
function _ganmodoki_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag: "table, ul.comments-link, div[class*=ad]",
    sanitizedAddTags: ["iframe"],
  });
}

// girlsreport.net
function _girlsreport_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      "table, ul.comments-link, div[class*=ad], div[id*=ad], div.top_link, dl.article-tags, div.relation-title, div.article-over",
    sanitizedAddTags: ["iframe"],
  });
}

// ge-sewa-news.blog.jp
function _ge_sewa_news_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      "table, ul.comments-link, div[class*=ad], div[id*=ad], div[id*=ldblog_related], div[class*=related], div[class*=ninja], div.top_link, dl.article-tags, div.relation-title, div.article-over, br",
    sanitizedAddTags: ["iframe"],
  });
}

// jpsoku.blog.jp
function _jpsoku_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag:
      "table, ul.comments-link, div[class*=ad], div[id*=ad], div[id*=ldblog_related], div[class*=related], div[class*=ninja], div.widgets, [id*=widget], [class*=widget], [class*=wrap], div.relation-title, div.article-over, br",
    removeEmptyTag: "div",
    sanitizedAddTags: ["iframe"],
  });
}

// cavolump.com
function _cavolump_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-body-more",
    removeSelectorTag:
      "table, ul.comments-link, div[class*=ad], div[id*=ad], div[id*=ldblog_related], div[class*=related], div[class*=ninja],div.widgets, [id*=widget], [class*=widget], [class*=wrap], div.relation-title, div.article-over, br",
    sanitizedAddTags: ["iframe"],
  });
}

// tyoieronews.blog.jp
function _typieronews_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-body-inner",
    removeSelectorTag:
      "table, ul.comments-link, div[class*=ad], div[id*=ad], div[id*=ldblog_related], div[class*=related], div[class*=ninja],li2, blockquote, [class*=widget], [class*=wrap], div.relation-title, div.article-over, br",
    sanitizedAddTags: ["iframe"],
  });
}

// TODO twintailsokuhou.blog.jp imgur not
function _twintailsokuhou_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      "table, ul.comments-link, div[class*=ad], div[id*=ad], div[id*=ldblog_related], div[class*=related], div[class*=ninja], li2, blockquote, [class*=widget], [class*=wrap], div.relation-title, div.article-over, br",
    sanitizedAddTags: ["iframe"],
    removeTag: ["p"],
  });
}

// drdinl.com
function _drdinl_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "section.content",
    removeSelectorTag:
      "div.osusume_text, div[id*=custom_html], div[class*=ad], div[id*=ad], div[id*=ldblog_related], div[class*=related], div[class*=ninja],li2, blockquote, [class*=widget], [class*=wrap], div.relation-title, div.article-over, br",
    sanitizedAddTags: ["iframe"],
    removeTag: ["p"],
  });
}

// news.tokimeki-s.com
function _tokimeki_s_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "section.content",
    removeSelectorTag:
      "div.osusume_text, div[id*=custom_html], div[class*=ad], div[id*=ad], div[id*=ldblog_related], div[class*=related], div[class*=ninja],li2, blockquote, [class*=widget], [class*=wrap], div.relation-title, div.article-over, br",
    sanitizedAddTags: ["iframe"],
    removeTag: ["p"],
  });
}

// nanj-push.blog.jp
function _nanj_push_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      "div.amazon, div[id*=custom_html], div[class*=ad], div[id*=ad], div[id*=ldblog_related], div[class*=related], div[class*=ninja],li2, blockquote, [class*=widget], [class*=wrap], div.relation-title, div.article-over, br",
    sanitizedAddTags: ["iframe"],
    removeTag: ["p"],
  });
}

// inutomo11.com
function _inutomo11_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      "div.amazon, div[id*=custom_html], div[class*=ad], div[id*=ad], div[id*=ldblog_related], div[class*=related], div[class*=ninja],li2, blockquote, [class*=widget], [class*=wrap], div.relation-title, div.article-over, br, b",
    sanitizedAddTags: ["iframe"],
    removeTag: ["p"],
  });
}

// blog.livedoor.jp/nanjstu/
function __nanjstu_blog_livedoor_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      "div.amazon, div[id*=custom_html], div[class*=ad], div[id*=ad], div[id*=ldblog_related], div[class*=related], div[class*=ninja],li2, blockquote, [class*=widget], [class*=wrap], div.relation-title, div.article-over, br, b",
    sanitizedAddTags: ["iframe"],
    removeTag: ["p"],
  });
}

// www.nandemo-uketori.com
function _nandemo_uketori_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      "div.amazon, div[id*=custom_html], div[class*=ad], div[id*=ad], div[id*=ldblog_related], div[class*=related], div[class*=ninja],li2, blockquote, [class*=widget], [class*=wrap], div.relation-title, div.article-over, b",
    sanitizedAddTags: ["iframe"],
    removeTag: ["p"],
  });
}

// notesoku.com
function _notesoku_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag:
      "div.amazon, div[id*=custom_html], div[class*=ad], div[id*=ad], div[id*=ldblog_related], div[class*=related], div[class*=ninja],li2, blockquote, [class*=widget], [class*=wrap], div.relation-title, div.article-over, b",
    sanitizedAddTags: ["iframe"],
    removeTag: ["p"],
    reducebr: 3,
  });
}

// blog.esuteru.com
function _blog_eseteru_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-more",
    removeSelectorTag: "div.amzlet-box",
    sanitizedAddTags: ["iframe"],
    removeTag: ["p"],
    reducebr: 3,
  });
}

// pioncoo.net
function _pioncoo_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag: "div.amazlet-box, div[class*=sample], div.widgets",
    sanitizedAddTags: ["iframe"],
    removeTag: ["p"],
    reducebr: 3,
  });
}

// TODO burusoku-vip.com imgur not
function _burusoku_vip_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag: "div[id*=ad], div[class*=include], div.widgets",
    sanitizedAddTags: ["iframe", "script"],
    removeTag: ["p"],
    reducebr: 3,
  });
}

// blog.livedoor.jp/pururungazou
function __purururungazou_blog_livedoor_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag: "div[id*=ad], div[class*=include], div.widgets",
    sanitizedAddTags: ["iframe"],
  });
}

// matomecup.com
function _matome_cup_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.ently_text",
    removeSelectorTag:
      "div[id*=ad], div[class*=include], p[class*=pickup], table, dl.relate_dl, [class*=ninja], [class*=menuTab], div.widgets",
    sanitizedAddTags: ["iframe"],
  });
}

// matomeblade.com
function _matomeblade_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      "div[id*=ad], table, dl.relate_dl, [class*=include, ninja, menuTab, pickup], div.widgets",
    sanitizedAddTags: ["iframe"],
  });
}

// 2ch-matomenews.com
function _2ch_matomenews_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag:
      'div[id*=ad], div[class=include], p[class*=pickup], div.inyou, div.link-card, div.slides, div.blog-card, div.linkcard, dl.relate_dl, [class*=ninja], [class*=menuTab], div.widgets, a[href*="al.dmm.co.jp"], h2',
    sanitizedAddTags: ["iframe"],
    removeTag: ["ins"],
  });
}

// www.maruhorror.com
function _maruhorror_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'div[id*=ad], div[class=include], p[class*=pickup], div[class*=amz], p.maru, [style*=text-align], div.link-card, div.slides, div.blog-card, div.linkcard, dl.relate_dl, [class*=ninja], [class*=menuTab], div.widgets, a[href*="al.dmm.co.jp"], h2',
    sanitizedAddTags: ["iframe"],
  });
}

// TODO manpukunews.blog.jp imgur
function _manpukunews_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      "div[id*=ad], div[class*=include], p[class*=pickup], div[class*=amz], p.maru, [style*=text-align], div.link-card, div.slides, div.blog-card, div.linkcard, dl.relate_dl, [class*=ninja], [class*=menuTab], div.widgets, div.article-tags",
    sanitizedAddTags: ["iframe"],
  });
}

// blog.livedoor.jp/aoba_f
function __aoba_f_blog_livedoor_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'div[id*=ad], div[class*=include], p[class*=pickup], div[class*=amz], p.maru, [style*=text-align], div.link-card, div.slides, div.blog-card, div.linkcard, dl.relate_dl, [class*=ninja], [class*=menuTab], div.widgets, div.article-tags, a[href*="al.dmm.co.jp"], h2',
    sanitizedAddTags: ["iframe"],
  });
}

// michaelsan.livedoor.biz
function _michaelsan_livedoor_biz_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "article.firat-article",
    removeSelectorTag:
      'div.posted, div[id*="ad"], div.comments-head, ol, table, div.pagetop, a[href*="amazon"]',
    sanitizedAddTags: ["iframe"],
  });
}

// yurugame.doorblog.jp
function _yurugame_doorblog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body",
    removeSelectorTag: 'div[id*="ad"], div[class*="amazon"]',
    sanitizedAddTags: ["iframe"],
  });
}

// blog.livedoor.jp/wakusoku
function __wakusoku_blog_livedoor_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    sanitizedAddTags: ["iframe"],
  });
}

// idle-girl.com
function _idle_girl_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.post > div.clearfix",
    removeSelectorTag: "div.widget_custom_html, div.textwidget, aside",
  });
}

// ginjimasu.blog.jp
function _ginjimasu_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag: 'div[class*="rss-blog"]',
  });
}

// aqua2ch.net
function _aqua2ch_blog_extract(body) {
  return base_extract(body, {
    mainSelectorFunction: ($) => {
      return $("div.article > div.menu_title1132").first();
    },
    removeSelectorTag: 'div[class*="ad"]',
    sanitizedAddTags: ["iframe", "script"],
  });
}

// adultgeek.net
function _adultgeek_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag: "div.rss, div.quote",
    sanitizedAddTags: ["iframe", "script"],
  });
}

// anacap.doorblog.jp
function _anacap_doorblog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body",
    removeSelectorTag:
      'div[class*="anacap-roll"], div[id*="ldblog_related"], dl.article-tags',
    removeTag: ["center"],
    sanitizedAddTags: [],
  });
}

// anihatsu.com
function _anihatsu_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'div[id*="ad"], div.pickup-link, div[style*="padding: 10px 5px; margin-bottom: 10px; border: 2px solid #00BFFF;"]',
    removeTag: ["center", "blockquote"],
    sanitizedAddTags: [],
  });
}

// ichinuke.com -> can get all images from feed
function _ichinuke_extract(body) {
  // TODO
}

// elephant.2chblog.jp
function _elephant_2chblog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: 'div[id="main"] > div.article',
    removeSelectorTag:
      'div[align="right"], div[id*="ad"], div[class*="yms"], div[id*="ldblog_related"], div.tab_area, ul[id*="rdmJump"], div.article-option, div.comment_form, a[name="comments"], ul.clearfix, div[style*="margin:10px 0px 40px 340px;"]',
    sanitizedAddTags: ["iframe"],
  });
}

// facebook-neta.com
function _facebook_neta_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag: 'p[style*="text-align:right"]',
    sanitizedAddTags: ["iframe", "script"],
    removeAffiID: true,
  });
}

// ertk.net
function _ertk_extract(body) {
  return base_extract(body, {
    mainSelectorTag: 'div[id="post-after"]',
    sanitizedAddTags: ["iframe", "script"],
    removeAffiID: true,
    to_full_imgs: "https://ertk.net/",
  });
}

// eronetagazou.com -> can get all images from feed
function _eronetagazou_extract(body) {
  // TODO
}

// flashff.blog.jp
function _flashff_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
  });
}

// eromazofu.com -> can get all images from feed
function _eromazofu_extract(body) {
  // TODO
}

// erologz.com TODO imgur api
function _erologz_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag: 'div[class*="ad"], div[class*="banner"], div.flpc',
    iframe_to_img_with_src: true,
  });
}

// ero-shame.club
function _ero_shame_club_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag: 'div.mon, div[id*="kizi"], div.bbsarea',
    sanitizedAddTags: [],
  });
}

// erogazoo.net
function _erogazoo_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.post",
    removeSelectorTag:
      'div.mon, div[id*="kizi"], div.bbsarea, div.pcstay, div.pcad, div.spad, div[id*="kanren"], div[id*="area"], div.sns, div.blog_info, div.clearfix, div[id*="comments"]',
  });
}

// erogazoo555.com -> can get all img from feed
function _erogazo555_extract(body) {
  // TODO
}

// eromitai.com
function _eromitai_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag: 'a[rel*="sponsor"]',
  });
}

// okazurand.net
function _okazurand_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "section.product-detail-content",
    removeSelectorTag: "div.pickup-post-widget",
    convertSourceToVideoTag: "div.wp-block-video-js",
  });
}

// otakomu.jp
function _otakomu_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-more",
    removeSelectorTag: "div.amazlet-box",
    removeTag: ["center"],
  });
}

// jin115.com
function _jin115_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article_bodymore",
    removeTag: ["table"],
  });
}

// scienceplus2ch.com
function _scienceplus2ch_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.Article__content",
    removeSelectorTag: 'div[id*="ad"], div[id*="article_id"]',
  });
}

// gahalog.2chblog.jp
function _gahalog_2chblog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
  });
}

// blog.livedoor/kinisoku/
function _kinisoku_blog_livedoor_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article_body",
    removeSelectorTag:
      'div[id*="ad"], ul.clearfix, p.all_article, div[align*="right"]',
    removeTag: ["blockquote"],
    sanitizedAddTags: [],
    fixBase64ImgRegex: true,
  });
}

// kimootoko.net
function _kimootoko_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.post_content",
    removeSelectorTag:
      "hr.bigkugirisen, hr.kugirisen, div.widget_text, div.syousai, div.fanzakiji-hako, div.pickup",
    sanitizedAddTags: [],
    img_datasrc_to_img_src: "data-lazy-src",
  });
}

// kyarabetsunijiero.net
function _kyarabetsunijiero_extract(body) {
  // TODO
  // need pagination feature
  // loop page {
  //    contents += base_extract (page)
  // }
}

// blog.livedoor.jp/goodloser TODO imgur API
function _goodloser_blog_livedoor_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-more",
  });
}

// konoyubitomare.jp
function _konoyubitomare_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'div[style*="margin-bottom:55px;"], div[class*="amazon"], div[class*="sp_show"]',
  });
}

// news.2chblog.jp
function _news_2chblog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag: 'div[id*="ad"], div.kjs, table, div[class*="ama"]',
  });
}

// 1000giribest.com
function _1000giribest_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag: 'div[class*="box"]',
  });
}

// blog.livedoor.jp/diet2channel
function __diet2channel_blog_livedoor_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'hr, span, iframe, div[align="left"], div[class*="ad"], a.more, div[id*="ldblog_related"]',
    sanitizedAddTags: [],
  });
}

// www.news30over.com
function _news30over_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.mainmore",
    removeSelectorTag:
      'div[id=fb-box], div[class*="sns"], div.ad-rectangles_single',
    imgurToImg: true,
    removeTagStr: "script",
  });
}

// www.negisoku.com
function _negisoku_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'div.c_img, div[id*="ldblog_related"], span[style*="font-size: 18px; line-height: 27px;"], center, div[style*="margin:0px;padding:2px;"]',
    imgurToImg: true,
    removeTagStr: "script",
  });
}

// netizen-voice.blog.jp
function _netizen_voice_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'ins, div.c_img, dl[class*="article-tags"], div[class*="ninja-recommend-block"]',
    sanitizedAddTags: [],
  });
}

// po-kaki-to.com
function _po_kaki_to_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag:
      'h3, div.pc-contents-center, div[style*="float:left; width: 280px;"], div[style*="clear: both;"], div.pc-none, div.nnnnn cf, center, div.entry-footer',
  });
}

// mesu-jiru.com
function _mesu_jiru_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "figure.wp-block-gallery",
  });
}

// www.jikenjiko-hukabori.com
function _jikenjiko_hukabori(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
  });
}

// rabitsokuhou.2chblog.jp // TODO
function _rabitsokuhou_2chblog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entrybody",
    removeSelectorTag:
      'dd, div[style="text-align: left; margin: 0 10px 10px 10px; width:300px;"], span.related, div[id*="ad"]',
    sanitizedAddTags: ["iframe"],
  });
}

// warotanikki.com
function _warotanikki_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.content",
    removeSelectorTag: "div.img-grid",
  });
}

// adaman-ero.com
function _adaman_ero_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag: "div.arpw-random-post, div.banner, div.jp-relatedposts",
  });
}

// moeimg.net
function _moeimg_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.post-single",
    removeSelectorTag:
      'div[class*="ad"], div[class*="pc"], div.entryblock, div.navigation, div[id*="ad"], div.box_title, div.entry-footer, div.center, ol.commentlist, div[id="respond"]',
  });
}

// hattatu-matome
function _hattatu_matome_ldblog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag: 'ins, div.rss-husen, div.article_mid_v2, div[id*="ad"]',
  });
}

// blog.livedoor.jp/nwknews
function __nwknews_blog_livedoor_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'div.kijinakakoukoku, dl.article-tags, div[id*="ad"], a[href*="https://amzn.to"], img.pict',
  });
}

// www.kokunanmonomousu.com
function _kokunanmonomousu_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article__content",
    removeSelectorTag: "div.ninja-recommend-block",
  });
}

// blog.livedoor.jp/a_load
function __a_load_blog_livedoor_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag: 'div[id*="rss"], div[id*="id"]',
  });
}

// vipsister23.com
function _vipsister23_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-body",
    removeSelectorTag:
      'div.clearfix, div.center, span[class*="imob_infeed"], blockquote, div[id*="div_fam"], div[align="center"]',
  });
}

// erogazoumura.com // TODO too much center br tag in last
function _erogazomura_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.ently_text",
    removeSelectorTag:
      'div.fc2_footer, dl[class*="relate_dl"], div[align="right"], a[href*="erogazoumura"], div.saiup_dougax',
    sanitizedAddTags: [],
  });
}

// tabinalog.com
function _tabinalog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag: "div.amazon-item-box",
  });
}

// gfoodd.com // TODO imgur
function _gfoodd_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    removeSelectorTag: 'div.code-block, div[class*="blogcard"]',
    iframe_to_img_with_src: true,
  });
}

// blog.livedoor.jp/rbkyn844
function __rbkyn844_blog_livedoor_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-more",
    removeSelectorTag:
      'div[class*="amazon"], div[class*="link"], div[class*="no-pc"], div.c_img, h3',
    convertAnchorToImg: true,
    sanitizedAddTags: [],
  });
}

//himasoku.com // TODO
function _himasoku_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'div[id*="ad"], span[style="color: #CC0033; font-weight: bold; font-size: 25px;"], div.netabare, div.akares, div[style="color: #CC0033; font-weight: bold; font-size: 16px; background-color: #e6e6fa;"]',
  });
}

// bakutan.blog.jp
function _bakutan_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag: 'div[id*="rss"], div[align="center"], script.jp1-ad',
  });
}

// tozanchannel.blog.jp
function _tozanchannel_blog_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'div[style*="font-size: 120%; padding-left:10px; padding-right:10px; width:auto;"], div[style*="display: inline-block; background: #20b2aa; padding: 3px 10px; color: #ffffff;"], div[style*="padding: 10px; border: 2px solid #20b2aa;"]',
  });
}

// inazumanews2.com
function _inazumanews2_extract(body) {
  return base_extract(body, {
    mainSelectorTag: 'div.article-body-inner > div[id*="resid"]',
  });
}

// yaruo.info
function _yaruo_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "section.entry-content",
    visibleImage: "a",
  });
}

// tintinbravo.com // TODO cannot extract html element
function _tintinbravo_extract(body) {
  console.log("hello?");
  return base_extract(body, {
    mainSelectorTag: "div.post_content",
  });
}

// xn--r8jwklh769h2mc880dk1o431a.com
function _xn__r8jwklh769h2mc880dk1o431a_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.post_content",
    removeSelectorTag:
      'div.kankiji, div.c-balloon, div[style="float: none; margin:0px;"], p.entry-recommended, div.swell-block-button',
    visibleImage: "p > a",
  });
}

// news4vip.livedoor.biz
function _news4vip_livedoor_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.ently_body",
    removeSelectorTag:
      'dul.blogroll-list-wrap, div[id*="f984a"], div[id*="ad"], div[class*="ad"], div[id*="ldblog_related"], div.ently_navi-info, div.article-footer, div.menu, a[name="comments"], div.sub, center, div[id*="comment"]',
    sanitizedAddTags: [],
  });
}

// alfalfalfa.com // TODO
function _alfalfalfa_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.main_article_contents_inner",
    removeSelectorTag:
      'div[id*="ad"]. div[class*="ad"], div.clearfix, ul.automatic-related, div.social-list, ul.manual-related, div.catch, aside',
    sanitizedAddTags: [],
  });
}

// itainews.com
function _itainews_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.blogbody",
    removeSelectorTag:
      'div[id*="ad"], div.menu, div.posted, div.poweredAdsBy, span.aa, div.amazon',
    sanitizedAddTags: [],
  });
}

// news23vip
function __news23vip_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'a[href*="http://blog.livedoor.jp/news23vip/"], div.amazon, div[class*="ad"], div[id*="ad"]',
    sanitizedAddTags: [],
    reducebr: 3,
  });
}

// hamusoku.com
function _hamusoku_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'div.popularArticlesWithImage, div.yms-user-ad, strong:last-of-type, a[href*="amzn"], img[src*="amzn"], div[id*="ad"], span:last-of-type',
    sanitizedAddTags: [],
    reducebr: 3,
  });
}

// minkch.com
function _minkch_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "article.clearfix > div.clearfix",
    to_full_url: "https://",
    removeSelectorTag:
      'div[class*="yarpp"], br.clear, img[title="minkch"], p:last-of-type',
  });
}

// itaishinja.com
function _itaishinja_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article_body",
    removeSelectorTag:
      'ul.clearfix, div[id*="ad"], div[class*="ad"], div.clearfix, a[href*="https://moudamepo.com"], h3, div[id*="rss"], div[id*="comment"], div[id*="ldblog_related"], div:last-of-type',
    transVisibleImage: "div > a",
    reducebr: 4,
  });
}

// bluejay01-review
function __bluejay01_review_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag: "div.amaquick-box",
    sanitizedAddTags: [],
  });
}

// erocon.gger.jp
function _erocon_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    sanitizedAddTags: [],
  });
}

// newsoku.blog
function _newsoku_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "article.article",
    removeSelectorTag:
      'footer, div.blogroll-channel, div.blog-card-footer, div[style*="border-bottom: solid 5px #9b1c38;"]',
    sanitizedAddTags: [],
  });
}

// /itsoku/
function __itsoku_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'ul.clearfix, div[id*="ad"], div[class*="ad"], div.clearfix, a[href*="https://moudamepo.com"], h3, div[id*="rss"], div[id*="comment"], div[id*="ldblog_related"], div:last-of-type, dl.article-tags',
    sanitizedAddTags: [],
  });
}

// toushichannel.net
function _toushichannel_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'div.bottom-link, div[id*="ad"], dl.article-tags, div[style*="margin:15px;height:280px;"]',
    sanitizedAddTags: [],
  });
}

// www.gadget2ch.com
function _gadeget2ch_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    sanitizedAddTags: [],
  });
}

// www.vipnews.jp
function _vipnews_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'div[class*="ad"], div[id*="ad"], div.article-body-more > div.t_h:first-of-type, div[style*="text-align: center;"], p[style*="color:gray;text-align:right;"]',
    sanitizedAddTags: [],
  });
}

// www.jisaka.com
function _jisaka_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag:
      'div[class*="ad"], div[id*="ad"], dl.article-tags, div.amaquick-box',
    sanitizedAddTags: [],
  });
}

// www.gurum.biz // TODO
function _gurum_extract(body) {
  return base_extract(body, {
    mainSelectorFunction: ($) => {
      return $('div[id="articlebodymore"]').add($('div[id="articlebody"]'));
    },
    removeSelectorTag: "div.amazonDefault",
    // removeSelectorTag: 'div.wp_social_bookmarking_light, div.clearfix, div[id*="ad"], div[class*="ad"]',
  });
}

// /isaacalwin1219/
function __isaacalwin1219_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag: "ins",
    sanitizedAddTags: [],
  });
}

// m4ex.com
function _m4ex_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article",
    visibleImage: "div > a",
    removeSelectorTag:
      'b:first-of-type, p.footer-post-meta, div.sns-group, div[align="left"], div[style="margin-top: 4px;"]',
    sanitizedAddTags: [],
  });
}

// www.gosunkugi.com
function _gosunkugi_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.entry-content",
    sanitizedAddTags: [],
    fixBase64ImgRegex: true,
  });
}

// outdoormatome.com
function _outdoormatome_extract(body) {
  return base_extract(body, {
    mainSelectorTag: "div.article-body-inner",
    removeSelectorTag: 'dl.article-tags, div[id*="ad"], div[class*="ad"]',
    sanitizedAddTags: [],
  });
}

// const url = 'https://ani-chat.net/post-288328/'
// const url = 'https://1000mg.jp/226779/'
// const url = 'https://2ch-ero-report.blog.jp/archives/37874065.html'
// const url = 'https://5ch-echiechi.doorblog.jp/archives/26849505.html'
// const url = "https://2chav.com/blog-entry-26136";
// const url = 'https://bakuwaro.com/post-253705/'
// const url = 'http://bipblog.com/archives/5894739.html'
// const url = 'https://lucky318b.com/archives/1864971'
// const url = 'https://www.hiroiro.com/tabilog/69569.html'
// const url = 'https://jumpsokuhou.blog.jp/archives/1083158921.html'
// const url = 'https://pokemon-goh.doorblog.jp/archives/44047168.html'
// const url = 'https://openworldnews.net/archives/1082531168.html'
// const url = 'https://openworldnews.net/archives/1082589750.html'
// const url = 'http://www.shock-tv.com/impact/47743'
// const url = 'https://you1news.com/archives/134594.html'
// const url = 'http://vippers.jp/archives/10327845.html'
// const url = 'https://zch-vip.com/archives/62154239.html'
// const url = 'https://mashlife.doorblog.jp/archives/58987835.html'
// const url = 'https://moez-m.com/moe/?p=34853'
// const url = 'http://www.watch2chan.com/archives/202502150132.html'
// const url = 'https://asianoneta.blog.jp/62154839'
// const url = 'http://aramame.net/archives/432637'
// const url = 'https://iroironetnews.blog.jp/archives/31142709.html'
// const url = 'http://usi32.com/archives/31203620'
// const url = 'http://hnalady.com/blog-entry-27836.html'
// const url = 'http://hnalady.com/blog-entry-27841.html'
// const url = 'https://suitjoshi.com/new-employee/7339/'
// const url = 'https://www.hdouga.com/moviehtml/movie24280_01.html'
// const url = 'http://www.oumaga-times.com/archives/1084642757.html'
// const url = 'https://oshirigazo.com/chakui-shiri/cosplayer/9023/'
// const url = 'https://onihimechan.com/archives/594500096.html'
// const url = 'https://crx7601.com/archives/62155479.html'
// const url = 'https://bakufu.jp/archives/1057092'
// const url = 'https://oryouri.2chblog.jp/archives/10851852.html'
// const url = 'https://ganmodoki.net/6999/'
// const url = 'http://girlsreport.net/archives/53447168.html'
// const url = 'https://ge-sewa-news.blog.jp/archives/53445037.html'
// const url = 'https://ge-soku.com/archives/games-6389.html'
// const url = 'https://jiwasoku.com/2025/02/17/post-213854/'
// const url = 'https://cavolump.com/foreigner/61399/'
// const url = 'https://tyoieronews.blog.jp/archives/1084257883.html'
// const url = 'https://twintailsokuhou.blog.jp/archives/89401712.html'
// const url = 'https://drdinl.com/3d-erogazou/amateur/314183/'
// const url = 'https://nanj-push.blog.jp/archives/90018695.html'
// const url = 'http://inutomo11.com/archives/36207405.html'
// const url = 'http://blog.livedoor.jp/nanjstu/archives/62160743.html'
// const url = 'https://www.nandemo-uketori.com/archives/39243331.html'
// const url = 'https://notesoku.com/archives/36026'
// const url = 'http://blog.esuteru.com/archives/10329683.html'
// const url = 'https://pioncoo.net/articles/post-415812.html'
// const url = 'http://burusoku-vip.com/archives/2086080.html'
// const url = 'http://blog.livedoor.jp/pururungazou/archives/10328000.html'
// const url = 'http://matomecup.com/blog-entry-77111.html'
// const url = "https://matomeblade.com/archives/22166305313.html";
// const url = 'http://2ch-matomenews.com/749891/'
// const url = 'http://www.maruhorror.com/archives/46426485.html'
// const url = 'https://manpukunews.blog.jp/43748239.html'
// const url = 'http://blog.livedoor.jp/aoba_f/archives/62158284.html'
// const url = 'https://michaelsan.livedoor.biz/archives/52056349.html'
// const url = 'https://yurugame.doorblog.jp/archives/39342044.html'
// const url = 'http://blog.livedoor.jp/wakusoku/archives/1811212.html'
// const url = 'https://idle-girl.com/2025/03/09/g-nogizaka46-251-260/'
// const url = 'https://ginjimasu.blog.jp/archives/62206237.html'
// const url = 'http://aqua2ch.net/archives/59031923.html'
// const url = 'https://www.adultgeek.net/100713/'
// const url = 'https://anacap.doorblog.jp/archives/62210025.html'
// const url = 'http://anihatsu.com/archives/94749552.html'
// const url = 'https://ichinuke.com/kassyoku35/'
// const url = 'https://elephant.2chblog.jp/archives/52365312.html'
// const url = 'https://facebook-neta.com/103478/'
// const url = 'https://ertk.net/archives/965237.html'
// const url = 'https://erologz.com/204708.html'
// const url = 'https://ero-shame.club/blog-entry-23595.html'
// const url = 'https://erogazoo.net/blog-entry-170310.html'
// const url = 'https://eromitai.com/archives/388457/'
// const url = 'https://www.okazurand.net/foreign-womens-penis-comparison/'
// const url = 'http://otakomu.jp/archives/38110080.html'
// const url = 'http://jin115.com/archives/52420532.html'
// const url = 'http://www.scienceplus2ch.com/article/posttime-202503151815.html'
// const url = 'https://gahalog.2chblog.jp/archives/52579927.html'
// const url = 'http://blog.livedoor.jp/kinisoku/archives/5589472.html'
// const url = 'https://kimootoko.net/archives/post-294587.html'
// const url = 'http://blog.livedoor.jp/goodloser/archives/46609523.html'
// const url = 'http://konoyubitomare.jp/archives/1082605728.html'
// const url = 'https://news.2chblog.jp/archives/52053218.html'
// const url = 'https://1000giribest.com/822717.html'
// const url = 'http://blog.livedoor.jp/diet2channel/archives/62214146.html'
// const url = 'https://www.news30over.com/archives/10342973.html'
// const url = 'http://www.negisoku.com/archives/56038638.html'
// const url = 'https://netizen-voice.blog.jp/archives/44007292.html'
// const url = 'https://www.po-kaki-to.com/archives/34686.html'
// const url = 'https://mesu-jiru.com/ase/4487/'
// const url = 'https://www.jikenjiko-hukabori.com/article/post-395757.html'
// const url = 'https://rabitsokuhou.2chblog.jp/archives/68991182.html'
// const url = 'http://warotanikki.com/349364'
// const url = 'https://adaman-ero.com/127197/'
// const url = 'https://moeimg.net/21703.html'
// const url = 'https://hattatu-matome.ldblog.jp/archives/62218883.html'
// const url = 'http://blog.livedoor.jp/nwknews/archives/6191545.html'
// const url = 'http://www.kokunanmonomousu.com/article/511861185.html'
// const url = 'http://blog.livedoor.jp/a_load/archives/59042358.html'
// const url = 'http://vipsister23.com/archives/10815828.html'
// const url = 'https://erogazoumura.com/blog-entry-6309.html'
// const url = 'https://tabinolog.com/archives/post-643626.html'
// const url = 'http://gfoodd.com/post-265653/'
// const url = 'http://blog.livedoor.jp/rbkyn844/archives/10816280.html'
// const url = 'http://himasoku.com/archives/52279735.html'
// const url = 'https://bakutan.blog.jp/archives/21163268.html'
// const url = 'https://tozanchannel.blog.jp/archives/1084338690.html'
// const url = 'https://yaruo.info/178687'
// const url = 'https://tintinbravo.com/2025/03/14/ofje00440/'
// const url = 'https://xn--r8jwklh769h2mc880dk1o431a.com/%e4%ba%8c%e6%ac%a1%e3%82%a8%e3%83%ad%e7%94%bb%e5%83%8f/high-school-girls-lifting-their-skirts-to-show-their-underwear'
// const url = 'https://news4vip.livedoor.biz/archives/52549878.html'
// const url = 'https://alfalfalfa.com/articles/10816899.html'
// const url = 'https://itainews.com/archives/2046741.html'
// const url = 'http://blog.livedoor.jp/news23vip/archives/6193618.html'
// const url = 'https://hamusoku.com/archives/10865671.html'
// const url = 'https://minkch.com/archives/33979.html'
// const url = 'http://itaishinja.com/archives/5574478.html'
// const url = 'http://blog.livedoor.jp/bluejay01-review/archives/62258924.html'
// const url = 'https://erocon.gger.jp/archives/38305055.html'
// const url = 'https://newsoku.blog/archives/199459'
// const url ='http://blog.livedoor.jp/itsoku/archives/62259006.html'
// const url = 'https://toushichannel.net/archives/44307111.html'
// const url = 'http://www.gadget2ch.com/archives/post-250412.html'
// const url = 'http://www.vipnews.jp/archives/28409161.html'
// const url = 'http://www.jisaka.com/archives/46697167.html'
// const url = 'http://www.gurum.biz/archives/100314557.html'
// const url = 'http://blog.livedoor.jp/isaacalwin1219/archives/39572878.html'
// const url = 'http://m4ex.com/swimsuit/sukumizu/sukumizu_tight37'
// const url = 'https://www.gosunkugi.com/archives/14491'
// const url = 'https://outdoormatome.com/archives/1084410418.html'

const extract = _outdoormatome_extract;

async function updatePreviewHtml(url) {
  try {
    let text = await getHtmlText(url);

    if (!text) {
      console.log(`INFO: Return null from getHtmlText(${url})`);
      return;
    }
    const extracted = extract(text);
    if (!extracted) {
      console.log(`INFO: Return null from extract(${url})`);
      return;
    }
    console.log(extracted);
    let content = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <title>記事一覧ビューア</title>
    <style>
      body { 
        margin: 0;
        padding: 0;
        width: 100vw;
        overflow-x: hidden;
        font-family: Arial, sans-serif;
        font-size: 16px;
        wrap: text-wrap;
      }
      .article { 
        margin-bottom: 10px;
        padding: 10px;
        border-top: 3px solid #aaa;
        width: 100vw;
        box-sizing: border-box;
      }
      img {
        width: 100%;
        height: auto;
        display: block;
        max-width: none;
      }
      .idname {
        margin-top: 20px;
        padding: 0.5rem;
        font-size: 12px;
        background: #eaf3ff;
        border-bottom: solid 3px #516ab6;
      }

      .txt {
        margin: 20px 0px 40px 5px;
        font-size: 18px;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <section class="article">
      <p><a href="${url}" target=_"blank">${url}</a></p>
      ${extracted}
    </section>
  </body>
</html>
            `;

    fs.writeFileSync(
      "/mnt/c/Users/untun/Downloads/preview.html",
      content,
      "utf8",
    );
    console.log("Update preview.html file");
  } catch (err) {
    console.log(err);
    return;
  }
}

await updatePreviewHtml(url);
// const $ = cheerio.load(await getHtmlText(url))
// console.log(_ani_chat_extract(await getHtmlText(url)))
// const style = $('style')
// console.log(style.toString())
console.log(`Finish Program`);
