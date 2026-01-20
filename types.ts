
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category_id?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
}

export interface Cursor {
  user_id: string;
  username: string;
  x: number;
  y: number;
  color: string;
}
