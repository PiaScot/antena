// /src/routes/api/image-proxy/+server.ts

import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
      return new Response("Image URL is required", { status: 400 });
    }

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      return new Response("Failed to fetch image", { status: response.status });
    }

    const headers = new Headers({
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=604800, immutable",
    });

    return new Response(response.body, { headers });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};
