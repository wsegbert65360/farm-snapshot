import { NewsData } from "./types";

const MAX_ARTICLES = 3;

const SEARCH_TERMS = "corn+soybean+farming+grain+market+prices";

// Prefer these sources — skip generic ones
const PREFERRED_SOURCES = [
  "Farm Progress",
  "Successful Farming",
  "AgWeb",
  "Pro Farmer",
  "DTN",
  "Farm Futures",
  "Reuters",
  "Bloomberg",
  "USDA",
  "CME Group",
  "Farm Journal",
  "No-Till Farmer",
  "Beef Magazine",
];

interface RssItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

function extractDomain(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    // Google News links are redirects — extract real domain from the URL path
    if (host === "news.google.com") {
      const match = url.match(/\/articles\/[A-Za-z0-9_-]+\.(.*)$/);
      if (match) return match[1].split("/")[0];
    }
    return host;
  } catch {
    return "";
  }
}

function scoreItem(item: RssItem): number {
  let score = 50;

  // Bonus for preferred ag sources
  for (const src of PREFERRED_SOURCES) {
    if (item.source.includes(src) || item.link.includes(src.toLowerCase().replace(/ /g, ""))) {
      score += 30;
      break;
    }
  }

  // Bonus for having "corn", "soy", "grain", "farm" in the title
  const titleLower = item.title.toLowerCase();
  if (/corn|soy|grain|farm|crop|plant|harvest|market|price/.test(titleLower)) {
    score += 15;
  }

  return score;
}

function parseRssXml(xml: string): RssItem[] {
  // Lightweight XML parser — no need for a full library for simple RSS
  const items: RssItem[] = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const titleMatch = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

    if (!titleMatch) continue;

    const title = (titleMatch[1] || titleMatch[2] || "").trim();
    const link = (linkMatch?.[1] || "").trim();
    const source = (sourceMatch?.[1] || extractDomain(link) || "News").trim();
    const pubDate = (pubDateMatch?.[1] || "").trim();

    if (title && link) {
      items.push({ title, link, source, pubDate });
    }
  }

  return items;
}

export async function fetchFarmNews(): Promise<NewsData> {
  try {
    const url = `https://news.google.com/rss/search?q=${SEARCH_TERMS}&hl=en-US&gl=US&ceid=US:en`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Farm-Command/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Google News RSS returned ${response.status}`);
      return { articles: [], updatedAt: new Date().toISOString() };
    }

    const xml = await response.text();
    const items = parseRssXml(xml);

    if (items.length === 0) {
      console.error("No articles parsed from RSS feed");
      return { articles: [], updatedAt: new Date().toISOString() };
    }

    // Score, deduplicate by title similarity, and take top 3
    const seenTitles = new Set<string>();
    const ranked = items
      .map((item) => ({ ...item, score: scoreItem(item) }))
      .sort((a, b) => b.score - a.score)
      .filter((item) => {
        // Deduplicate by first 6 words of title
        const key = item.title.split(/\s+/).slice(0, 6).join(" ").toLowerCase();
        if (seenTitles.has(key)) return false;
        seenTitles.add(key);
        return true;
      })
      .slice(0, MAX_ARTICLES);

    const articles = ranked.map((item) => ({
      title: item.title,
      url: item.link,
      source: item.source,
      snippet: "",
    }));

    return {
      articles,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Farm news fetch error:", error);
    return {
      articles: [],
      updatedAt: new Date().toISOString(),
    };
  }
}
