import ZAI from "z-ai-web-dev-sdk";
import { NewsData } from "./types";

const MAX_ARTICLES = 3;

const SEARCH_QUERIES = [
  "grain farming news today corn soybeans prices market",
  "agriculture news row crop farmers 2026",
  "corn soybean farming advice planting harvest",
];

// Domains to prefer — reputable ag sources
const GOOD_DOMAINS = [
  "agweb.com",
  "profarmer.com",
  "farmprogress.com",
  "dtpfertilizer.com",
  "usda.gov",
  "cbot.com",
  "successfulfarming.com",
  "agriculture.com",
  "farmjournal.com",
  "no-tillfarmer.com",
  "beefmagazine.com",
  "drovers.com",
  "farmgate.usda.gov",
  "thefieldreport.ca",
  "realagriculture.com",
  "grainnet.com",
];

// Domains to skip — YouTube, social media, clickbait
const SKIP_DOMAINS = [
  "youtube.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "tiktok.com",
  "reddit.com",
  "pinterest.com",
  "linkedin.com",
];

interface SearchResult {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function scoreResult(result: SearchResult): number {
  const domain = extractDomain(result.url);
  let score = 100 - result.rank * 10;

  // Bonus for preferred ag sources
  if (GOOD_DOMAINS.some(d => domain.includes(d))) {
    score += 50;
  }

  // Penalize skipped domains
  if (SKIP_DOMAINS.some(d => domain.includes(d))) {
    score -= 200;
  }

  // Bonus for meaningful snippet (indicates real article, not a stub)
  if (result.snippet.length > 80) {
    score += 10;
  }

  return score;
}

export async function fetchFarmNews(): Promise<NewsData> {
  try {
    const zai = await ZAI.create();

    // Run multiple queries in parallel for broader coverage
    const searchPromises = SEARCH_QUERIES.map(query =>
      zai.functions.invoke("web_search", { query, num: 8 }).catch(() => [] as SearchResult[])
    );

    const allResults = await Promise.all(searchPromises);
    const flat: SearchResult[] = allResults.flat();

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = flat.filter(r => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    // Score, sort, and take top 3
    const ranked = unique
      .map(r => ({ ...r, score: scoreResult(r) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ARTICLES);

    // Filter out any remaining bad domains
    const articles = ranked
      .filter(r => !SKIP_DOMAINS.some(d => extractDomain(r.url).includes(d)))
      .slice(0, MAX_ARTICLES)
      .map(r => ({
        title: r.name,
        url: r.url,
        source: r.host_name.replace(/^www\./, ""),
        snippet: r.snippet.length > 120 ? r.snippet.slice(0, 117) + "..." : r.snippet,
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
