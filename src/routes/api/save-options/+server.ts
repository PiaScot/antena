import { json, type RequestEvent } from "@sveltejs/kit";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST({ request }: RequestEvent) {
    const { domainName, mainSelectorTag, removeSelectorTags, sanitizedAddTags } =
        await request.json();

    try {
        const savedOptions = await prisma.selectorOptions.upsert({
            where: { domainName },
            update: { mainSelectorTag, removeSelectorTags, sanitizedAddTags },
            create: {
                domainName,
                mainSelectorTag,
                removeSelectorTags,
                sanitizedAddTags,
            },
        });

        return json({ success: true, data: savedOptions });
    } catch (error) {
        console.error(`failed to save options: ${error}`);
        return json(
            { success: false, error: `failed to save options` },
            { status: 500 },
        );
    }
}
