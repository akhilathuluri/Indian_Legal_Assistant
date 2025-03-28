export interface SearchResult {
  docs: SearchDoc[];
  categories: Array<[string, Array<{ formInput: string; value: string }>]>;
  found: string;
  encodedformInput: string;
}

export interface DocumentResult {
  doc: string;
  tid: string;
  title: string;
  citeList: Array<{
    tid: string;
    title: string;
  }>;
  citedbyList: Array<{
    tid: string;
    title: string;
  }>;
}

export interface Citation {
  id: string;
  title: string;
}

export interface SearchFilters {
  doctypes?: string;
  fromdate?: string;
  todate?: string;
  title?: string;
  cite?: string;
  author?: string;
  bench?: string;
}

export interface SearchDoc {
  tid: string;
  title: string;
  headline: string;
  docsource: string;
  publishdate: string;
  author?: string;
  authorEncoded?: string;
  authorid?: number;
  bench?: number[];
  cites?: Array<{
    tid: string;
    title: string;
  }>;
  doctype: number;
}
