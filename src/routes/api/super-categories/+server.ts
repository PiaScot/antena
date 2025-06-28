import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createSuperCategory } from "$lib/api/db/category";

/**
 * 新しい大カテゴリを作成する
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { label, order } = await request.json();

    if (typeof label !== "string" || typeof order !== "number") {
      return json({
        error:
          'Invalid payload. "label" (string) and "order" (number) are required.',
      }, { status: 400 });
    }

    const newSuperCategory = await createSuperCategory(label, order);

    return json(newSuperCategory, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error
      ? err.message
      : "An unknown error occurred";
    console.error("Error creating super category:", errorMessage);
    return json({ error: "Failed to create super category" }, { status: 500 });
  }
};
