import { getCollection } from "astro:content";
import type { APIContext } from "astro";

import { absoluteUrl, categoriesFor, escapeXml, seriesFor, sortPosts, tagsFor } from "../lib/blog";

export async function GET(context: APIContext): Promise<Response> {
  const posts = sortPosts(await getCollection("blog"));
  const pages: { lastmod?: Date; path: string }[] = [
    { path: "" },
    { path: "posts/" },
    { path: "categories/" },
    { path: "tags/" },
    { path: "archive/" },
    { path: "series/" },
    ...seriesFor(posts).map((series) => ({ path: "series/" + series.slug + "/" })),
    ...categoriesFor(posts).map((category) => ({ path: "categories/" + category.slug + "/" })),
    ...tagsFor(posts).map((tag) => ({ path: "tags/" + tag.slug + "/" })),
    ...posts.map((post) => ({ lastmod: post.data.updatedAt, path: "posts/" + post.id + "/" })),
  ];
  const urls = pages.map(
    (page) =>
      "<url><loc>" +
      escapeXml(absoluteUrl(page.path, context.site)) +
      "</loc>" +
      (page.lastmod === undefined ? "" : "<lastmod>" + page.lastmod.toISOString().slice(0, 10) + "</lastmod>") +
      "</url>",
  );
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
