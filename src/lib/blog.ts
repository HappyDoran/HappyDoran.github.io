import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { CollectionEntry } from "astro:content";

export const base = "/";
export const siteOwner = "HappyDoran";

export interface SiteSettings {
  description: string;
  links: { label: string; url: string }[];
  title: string;
}

/**
 * 게시 앱이 저장한 사이트 설정(.kanban-press/site.json, R11). 빌드는 저장소 루트에서 실행된다.
 * 파일이 없거나 값이 틀리면 그 항목만 기본값을 쓴다.
 */
export const site: SiteSettings = readSiteSettings();

function readSiteSettings(): SiteSettings {
  const fallback: SiteSettings = {
    description: "Notion에서 쓰고 GitHub Pages에 쌓아 가는 개발 기록입니다.",
    links: [],
    title: siteOwner + ".log",
  };
  // 이름 변경 전 위치(.notion-kanban-blog/)도 새 파일이 없을 때 읽는다.
  const path = [".kanban-press", ".notion-kanban-blog"]
    .map((directory) => join(process.cwd(), directory, "site.json"))
    .find((candidate) => existsSync(candidate));
  if (path === undefined) {
    return fallback;
  }
  try {
    const value = JSON.parse(readFileSync(path, "utf8")) as Partial<Record<keyof SiteSettings, unknown>>;
    const text = (input: unknown, max: number) => (typeof input === "string" ? input.trim().slice(0, max) : "");
    const links = Array.isArray(value.links) ? value.links : [];
    return {
      description: typeof value.description === "string" ? text(value.description, 200) : fallback.description,
      links: links
        .map((link: { label?: unknown; url?: unknown }) => ({ label: text(link?.label, 20), url: text(link?.url, 300) }))
        .filter((link) => link.label !== "" && link.url.startsWith("https://"))
        .slice(0, 4),
      title: text(value.title, 40) || fallback.title,
    };
  } catch {
    return fallback;
  }
}

export type BlogPost = CollectionEntry<"blog">;

export interface BlogCategory {
  count: number;
  name: string;
  posts: readonly BlogPost[];
  slug: string;
}

export function pathFor(path = ""): string {
  return base + path.replace(/^\/+/, "");
}

export function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function sortPosts(posts: readonly BlogPost[]): BlogPost[] {
  return [...posts].sort((left, right) => {
    const byDate = right.data.publishedAt.valueOf() - left.data.publishedAt.valueOf();
    return byDate === 0 ? compareText(left.id, right.id) : byDate;
  });
}

export function categoriesFor(posts: readonly BlogPost[]): BlogCategory[] {
  const grouped = new Map<string, { name: string; posts: BlogPost[] }>();
  for (const post of sortPosts(posts)) {
    const existing = grouped.get(post.data.categorySlug);
    if (existing === undefined) {
      grouped.set(post.data.categorySlug, {
        name: post.data.category,
        posts: [post],
      });
    } else {
      existing.posts.push(post);
    }
  }

  return [...grouped.entries()]
    .map(([slug, category]) => ({
      count: category.posts.length,
      name: category.name,
      posts: category.posts,
      slug,
    }))
    .sort((left, right) =>
      right.count - left.count ||
      compareText(left.name, right.name) ||
      compareText(left.slug, right.slug),
    );
}

export interface BlogTag {
  count: number;
  name: string;
  posts: readonly BlogPost[];
  slug: string;
}

/** 태그 주소. 카테고리 slug와 같은 규칙(영문·숫자 부분 + 정규화한 이름의 hash 8자)이라 한글 태그도 안정적이다. */
export function tagSlug(name: string): string {
  const normalized = name.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
  const hash = createHash("sha256").update(normalized, "utf8").digest("hex").slice(0, 8);
  const ascii = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48).replace(/-+$/g, "");
  return ascii ? ascii + "-" + hash : "tag-" + hash;
}

export function tagsFor(posts: readonly BlogPost[]): BlogTag[] {
  const grouped = new Map<string, { name: string; posts: BlogPost[] }>();
  for (const post of sortPosts(posts)) {
    for (const name of post.data.tags) {
      const slug = tagSlug(name);
      const existing = grouped.get(slug);
      if (existing === undefined) {
        grouped.set(slug, { name, posts: [post] });
      } else if (!existing.posts.includes(post)) {
        existing.posts.push(post);
      }
    }
  }
  return [...grouped.entries()]
    .map(([slug, tag]) => ({ count: tag.posts.length, name: tag.name, posts: tag.posts, slug }))
    .sort((left, right) => right.count - left.count || compareText(left.name, right.name));
}

export interface BlogSeries {
  name: string;
  posts: readonly BlogPost[];
  slug: string;
}

/** 시리즈(R10): seriesOrder가 작을수록 앞, 없으면 뒤에 두고 같으면 게시일이 이른 글이 앞이다. */
export function seriesFor(posts: readonly BlogPost[]): BlogSeries[] {
  const grouped = new Map<string, { name: string; posts: BlogPost[] }>();
  for (const post of posts) {
    const { series, seriesSlug } = post.data;
    if (series === undefined || seriesSlug === undefined) {
      continue;
    }
    const existing = grouped.get(seriesSlug) ?? { name: series, posts: [] };
    existing.posts.push(post);
    grouped.set(seriesSlug, existing);
  }
  const order = (post: BlogPost) => post.data.seriesOrder ?? Number.POSITIVE_INFINITY;
  return [...grouped.entries()]
    .map(([slug, series]) => ({
      name: series.name,
      posts: series.posts.sort(
        (left, right) =>
          order(left) - order(right) ||
          left.data.publishedAt.valueOf() - right.data.publishedAt.valueOf() ||
          compareText(left.id, right.id),
      ),
      slug,
    }))
    .sort((left, right) => compareText(left.name, right.name));
}

/** 게시일(UTC) 기준 연·월 묶음. 최근 달이 먼저다. */
export function archiveFor(posts: readonly BlogPost[]): { label: string; month: string; posts: BlogPost[] }[] {
  const grouped = new Map<string, BlogPost[]>();
  for (const post of sortPosts(posts)) {
    const month = post.data.publishedAt.toISOString().slice(0, 7);
    grouped.set(month, [...(grouped.get(month) ?? []), post]);
  }
  return [...grouped.entries()].map(([month, monthPosts]) => ({
    label: Number(month.slice(0, 4)) + "년 " + Number(month.slice(5, 7)) + "월",
    month,
    posts: monthPosts,
  }));
}

/** base path를 포함한 절대 주소(RSS·sitemap·Open Graph용). */
export function absoluteUrl(path: string, site: URL | undefined): string {
  return new URL(pathFor(path), site).href;
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

export function isDifferentDay(left: Date, right: Date): boolean {
  return left.toISOString().slice(0, 10) !== right.toISOString().slice(0, 10);
}
