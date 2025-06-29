// same definition with supabase registered schema
export interface Site {
  id: number;
  url: string;
  title: string;
  rss: string;
  category: string;
  domain: string;
  last_access: string;
  duration_access: number;
  scrape_options: ScrapeOption;
}

// personal specialized options
// default each Site has only removeSelectorTags
export interface ScrapeOption {
  removeSelectorTags: string[];
  display_mode?: "in_app" | "direct_link";
}

// same definition with supabase registered schema
export interface Article {
  id: number;
  site_id: number;
  title: string;
  url: string;
  category: string;
  content: string;
  pub_date: string;
  thumbnail: string;
}

// same definition with supabase registered schema
export interface Category {
  id: string;
  label: string;
  visible: boolean;
  super_category_id: number | null;
}

// same definition with supabase registered schema
export interface SuperCategory {
  id: string;
  label: string;
  order: number;
  created_at: string;
}

export interface SuperCategoryGroup extends SuperCategory {
  categories: Category[];
}

/**
 * 個別記事ページで使うための、完全な記事データ型
 */
export interface FullArticleData extends Article {
  site: Pick<Site, "title" | "scrape_options"> | null;
}
/**
 * 記事フィード一覧のカードで使うための、最適化された記事データ型
 * (以前の ArticleWithSiteName の後継)
 */
export interface ArticleFeedItem extends Omit<Article, "content" | "site_id"> {
  site: Pick<Site, "title" | "scrape_options"> | null;
}

// used in +page.server.ts
// return data with SSR, got data, data's count, has error(if have)
// ex)
// type BookmarkPageData = LoadPageData<ArticleWithSiteName>;
// type SitePageData = LoadPageData<Site>;
export interface LoadPageData<T> {
  items: T[];
  count: number;
  error?: string;
}
