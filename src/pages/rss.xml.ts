import { getCollection } from "astro:content";
import type { APIContext } from "astro";

import { absoluteUrl, escapeXml, site, sortPosts } from "../lib/blog";

/** 최근 글 20개. 본문 대신 설명만 넣는다(결정 D2). */
export async function GET(context: APIContext): Promise<Response> {
  const posts = sortPosts(await getCollection("blog")).slice(0, 20);
  const items = posts.map((post) => {
    const link = absoluteUrl("posts/" + post.id + "/", context.site);
    return [
      "<item>",
      "<title>" + escapeXml(post.data.title) + "</title>",
      "<link>" + escapeXml(link) + "</link>",
      '<guid isPermaLink="true">' + escapeXml(link) + "</guid>",
      "<pubDate>" + post.data.publishedAt.toUTCString() + "</pubDate>",
      "<description>" + escapeXml(post.data.description) + "</description>",
      "</item>",
    ].join("");
  });
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"><channel>',
    "<title>" + escapeXml(site.title) + "</title>",
    "<link>" + escapeXml(absoluteUrl("", context.site)) + "</link>",
    "<description>" + escapeXml(site.description || site.title) + "</description>",
    "<language>ko</language>",
    ...items,
    "</channel></rss>",
    "",
  ].join("\n");
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
