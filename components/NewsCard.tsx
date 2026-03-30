import { NewsData } from "@/lib/types";
import { config } from "@/lib/config";

interface NewsCardProps {
  data: NewsData;
}

export default function NewsCard({ data }: NewsCardProps) {
  if (data.articles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Farming News</h2>
        <p className="text-sm text-slate-400 text-center py-2">News unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-900">Farming News</h2>
        <span className="text-xs text-slate-400">
          {new Date(data.updatedAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: config.weather.timezone,
          })}
        </span>
      </div>
      <div className="space-y-2.5">
        {data.articles.map((article, i) => (
          <a
            key={article.url}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="flex gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 group-hover:text-blue-600 leading-snug transition-colors line-clamp-2">
                  {article.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {article.source}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
