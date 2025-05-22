import { XMLParser } from "fast-xml-parser";
import Encoding from "encoding-japanese";
import { gotScraping } from "got-scraping";
import type { Article } from "$lib/types";

export function removeSuffix(url: string): string {
	return url.replace(/(?:feed|index\.rdf)\/?$/, "");
}

export function removeQuery(url: string): string {
	try {
		const urlObj = new URL(url);
		return urlObj.origin + urlObj.pathname;
	} catch (err) {
		return "";
	}
}

export function toLocale(time: string): string {
	const d = new Date(time);
	return Number.isNaN(d.getTime()) ? time : d.toLocaleString();
}

export function removeDuplicateEmptyLine(text: string): string {
	return text.replace(/\n\s*\n+/g, "\n");
}

export default class SiteParser {
	url: string = "";
	rss: string;
	name: string = "";
	articles: Article[] = [];
	description: string | null = null;
	lastBuildDate: string | null = null;

	icon: string | null = null;

	constructor(rssUrl: string) {
		this.rss = rssUrl;
	}

	async init(cat: string): Promise<SiteParser> {
		try {
			const { body } = await gotScraping.get({
				url: this.rss,
				responseType: "buffer",
			});
			const buffer = new Uint8Array(body);
			const detected = Encoding.detect(body);
			let text: string;
			if (detected !== "UNICODE") {
				text = Encoding.convert(buffer, {
					from: detected,
					to: "UNICODE",
					type: "string",
				});
			} else {
				text = Buffer.isBuffer(body) ? body.toString() : String(body);
			}
			text = removeDuplicateEmptyLine(text);

			const parser = new XMLParser();
			const xmlObj = parser.parse(text);
			const info = xmlObj.rss?.channel || xmlObj["rdf:RDF"]?.channel;
			const items =
				xmlObj.rss?.item || xmlObj["rdf:RDF"]?.item || info?.item || [];
			const latestArticleDate =
				Array.isArray(items) && items.length > 0
					? items[0].pubDate || items[0]["dc:date"]
					: "";

			this.url = info.link || removeSuffix(this.rss) || "";
			this.name = info.title !== null ? String(info.title) : "";
			this.description = info.description || "";
			this.lastBuildDate = info?.lastBuildDate || latestArticleDate || "";
			if (this.lastBuildDate) {
				this.lastBuildDate = toLocale(this.lastBuildDate);
			}
			this.icon = info.image?.url || `${this.url}/favicon.ico`;

			const siteDomain = this.url ? new URL(this.url).hostname : "";

			for (const item of items) {
				const title: string = item.title || "";
				let articleUrl = "";
				try {
					const urlObj = new URL(item.link);
					articleUrl = urlObj.origin + urlObj.pathname;
				} catch (e) {
					articleUrl = item.link;
				}
				const pubDate: string = item.pubDate || item["dc:date"] || "";
				let content: string = item["content:encoded"] || item.description || "";
				const category: string = item.category || "";

				let thumbnail = "";
				if (content) {
					const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
					let match: RegExpExecArray | null = imgRegex.exec(content);
					while (match !== null) {
						const imgUrl = match[1].trim();
						try {
							const imgDomain = new URL(imgUrl).hostname;
							if (imgDomain === siteDomain) {
								thumbnail = imgUrl;
								break;
							}
						} catch (e) {
							console.log("catch try in utils/site.ts:110 line");
						}
						match = imgRegex.exec(content);
					}
				}
				content = "";
				const data: Article = {
					title,
					url: articleUrl,
					site_name: this.name,
					category: cat,
					content,
					pubDate,
					thumbnail,
				};

				this.articles.push(data);
			}
		} catch (err) {
			console.error(`Error processing RSS from ${this.rss}:`, err);
		}
		return this;
	}

	show(): void {
		console.log("========================");
		console.log(`NAME: ${this.name}`);
		console.log(`URL: ${this.url}`);
		console.log(`RSS URL: ${this.rss}`);
		console.log(`DESCRIPTION: ${this.description}`);
		console.log(`LAST BUILD DATE: ${this.lastBuildDate}`);
		console.log(`ICON URL: ${this.icon}`);
		console.log("-----------------------------");
		console.log("ARTICLES");
		for (const art of this.articles) {
			console.log(art);
		}
		console.log("========================\n");
	}

	hasContinueToReadText(): boolean {
		for (let i = 0; i < this.articles.length; i++) {
			const article = this.articles[i];
			if (!article.content.includes("続きを読む")) {
				return true;
			}
			if (i > this.articles.length) {
				break;
			}
		}
		return false;
	}
}
