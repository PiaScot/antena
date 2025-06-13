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
  scrape_options: object;
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
}

// for display frontend data
export interface ArticleWithSiteName {
  id: number;
  site_id: number;
  title: string;
  site_title: string;
  url: string;
  category: string;
  thumbnail: string;
  pub_date: string;
  content: string;
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
