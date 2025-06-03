// db defined schema

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
