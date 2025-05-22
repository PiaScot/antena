export interface Site {
  id: number;
  url: string;
  title: string;
  rss: string;
  category: string;
  domain: string;
  lastAccess: string;
  durationAccess: number;
  scrapeOptions: object;
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
