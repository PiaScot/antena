export interface Site {
	id: number;
	url: string;
	title: string;
	rss: string;
	category: string;
	domain: string;
	last_access: string;
	duration_access: number;
	scrape_options: {
		removeSelectorTags: string[];
		display_mode: 'direct_link' | 'iframe' | 'extract_content';
	};
}

export interface Article {
	id: number;
	site_id: number | null; // Changed to allow null
	title: string;
	url: string;
	category: string;
	thumbnail: string;
	pub_date: string;
	content: string;
}

export interface ArticleFeedItem extends Article {
	site?: {
		title: string;
		scrape_options: {
			removeSelectorTags: string[];
			display_mode: 'direct_link' | 'iframe' | 'extract_content';
		};
	};
}

export interface FullArticleData extends Article {
	site_title: string;
	site?: {
		title: string;
		scrape_options: {
			removeSelectorTags: string[];
			display_mode: 'direct_link' | 'iframe' | 'extract_content';
		};
	};
}

export interface Category {
	id: string;
	label: string;
	visible?: boolean;
	super_category_id?: number | null; // Added this line
}

export interface SuperCategory {
	id: number;
	label: string;
	order: number;
}

export interface SuperCategoryGroup extends SuperCategory {
	categories: Category[];
}

export interface RSSItem {
	link?: { [key: string]: string } | string;
	pubDate?: { [key: string]: string };
	published?: { [key: string]: string };
	'dc:date'?: string;
	title?: { [key: string]: string } | string;
	'hatena:imageurl'?: { [key: string]: string };
	description?: { [key: string]: string };
}
