export type MangaCard = {
  id: string;
  title: string;
  description: string;
  status: string;
  year: number | null;
  tags: string[];
  contentRating: string;
  coverUrl: string | null;
  author: string | null;
  artist: string | null;
  lastChapter: string | null;
};

export type ChapterItem = {
  id: string;
  title: string;
  chapter: string | null;
  volume: string | null;
  pages: number;
  publishAt: string | null;
  group: string | null;
  language: string;
};

export type ChapterPages = {
  chapterId: string;
  hash: string;
  baseUrl: string;
  pages: string[];
  dataSaver: string[];
};

export type LatestItem = MangaCard & { latestChapter: ChapterItem };
