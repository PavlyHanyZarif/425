export interface CategoryItem {
  id: string;
  name: string;
  custom?: boolean;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "كتب هزات", name: "كتب هزات" },
  { id: "تمجيدات", name: "تمجيدات" },
  { id: "طقس والحان", name: "طقس وألحان" },
  { id: "قرائات", name: "قراءات" },
];

export type BookCategory = string;

export interface Book {
  id: string;
  title: string;
  category: BookCategory;
  image: string;
  addedAt: number;
  pdfUrl?: string;
  pdfSize?: number;
}

export interface DownloadInfo {
  bookId: string;
  size: number;
  downloadedAt: number;
}

export const ADMIN_EMAIL = "admin@app.com";
export const ADMIN_PASSWORD = "123456";

export const formatBytes = (n: number): string => {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
};
