import type { CollectionEntry } from "astro:content";

export const base = "/";

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
