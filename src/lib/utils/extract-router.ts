import {
	_ani_chat_extract,
	_korewaeroi_extract,
	_1000mg_extract,
	// ...他も全部
} from "./extractors";

export default function extractFromDomain(url: string) {
	const hostname = new URL(url).hostname;
	if (hostname.includes("ani-chat.net")) return _ani_chat_extract;
	if (hostname.includes("korewaeroi.com")) return _korewaeroi_extract;
	if (hostname.includes("1000mg.jp")) return _1000mg_extract;
	// 他も追加していく
	throw new Error("Extractor not defined for domain: " + hostname);
}
