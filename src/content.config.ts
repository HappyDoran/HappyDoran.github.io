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
    category: "미분류",
    categorySlug: "uncategorized",
    schemaVersion: 1 as const,
    tags: [] as string[],
  }));

const tag = z.string().trim().min(1).max(40);
const v2 = z
  .object({
    ...fields,
    category: z.string().trim().min(1).max(80),
    categorySlug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    schemaVersion: z.literal(2),
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
