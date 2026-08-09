export type Category = {
  slug: string;
  name: string;
  tagline: string;
  art: string;
  featured?: string[];
  industries: string[];
  description: string;
};

export type Brand = {
  slug: string;
  name: string;
  tagline: string;
  origin: string;
  image: string;
};

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  categoryName: string;
  price: number;
  oldPrice?: number;
  stock: number;
  lowStockAt: number;
  rating: number;
  reviews: number;
  sold: number;
  model?: string;
  featured?: boolean;
  bestSeller?: boolean;
  new?: boolean;
  tags: string[];
  color?: string;
  size?: string;
  material?: string;
  weight?: string;
  certification?: string;
  standard?: string;
  warranty?: string;
  shelfLife?: string;
  country?: string;
  image?: string;
  description: string;
  features: string[];
  gallery?: string[];
  specs: { label: string; value: string }[];
  bulk: { qty: string; price: string; savings: string }[];
  downloads: { name: string; type: string; file?: string }[];
  related?: string[];
};

export type CartItem = {
  productId: string;
  qty: number;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
};

export type Guide = {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  excerpt: string;
  icon: string;
  image: string;
  content?: string;
};
