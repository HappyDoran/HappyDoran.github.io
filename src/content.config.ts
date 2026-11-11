import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const fields = {
  description: z.string().default(""),
  publishedAt: z.coerce.date(),
  title: z.string(),
  updatedAt: z.coerce.date(),
};

const v1 = z
  .object({
    ...fields,
    schemaVersion: z.undefined().optional(),
  })
  .transform((post) => ({
    ...post,
    pinned: false,
    schemaVersion: 1 as const,
    tags: [] as string[],
  }));

const tag = z.string().trim().min(1).max(40);
// 2026-11-11 전에 게시한 글에 남은 주제·시리즈 field. build만 통과시키고 화면에는 쓰지 않는다.
const retired = z.unknown().optional();
const v2 = z
  .object({
    ...fields,
    category: retired,
    categorySlug: retired,
    manuscriptPages: z.number().int().positive().optional(),
    pinned: z.boolean().default(false),
    schemaVersion: z.literal(2),
    series: retired,
    seriesOrder: retired,
    seriesSlug: retired,
    tags: z
      .array(tag)
      .max(10)
      .superRefine((tags, context) => {
        const seen = new Set<string>();
        for (const [index, value] of tags.entries()) {
          const normalized = value
            .normalize("NFKC")
            .trim()
            .replace(/\s+/gu, " ")
            .toLowerCase();
          if (seen.has(normalized)) {
            context.addIssue({
              code: "custom",
              message: "Tags must be unique after normalization",
              path: [index],
            });
          }
          seen.add(normalized);
        }
      }),
  })
  .strict();

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.union([v1, v2]),
});

export const collections = { blog };
