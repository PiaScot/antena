// /src/routes/api/image-proxy/+server.ts

import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url }) => {
  try {
    // 1. クエリパラメータから、取得したい画像のURLを受け取る
    const imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
      return new Response("Image URL is required", { status: 400 });
    }

    // 2. サーバー側で、その画像URLにリクエストを送信
    const response = await fetch(imageUrl, {
      headers: {
        // 一部のサイトはUser-Agentをチェックするため、偽装する
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      return new Response("Failed to fetch image", { status: response.status });
    }

    // 3. 取得した画像データを、そのままクライアント（ブラウザ）に返す
    // レスポンスヘッダーをコピーして、Content-Typeなどを正しく設定する
    const headers = new Headers({
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=604800, immutable", // 1週間キャッシュさせる
    });

    return new Response(response.body, { headers });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};
