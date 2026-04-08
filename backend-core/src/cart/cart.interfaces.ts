export interface CartItem {
  productId: string;
  quantity: number;
  title: string;
  price: number;
  image?: string;
}

export interface CartTotal {
  items: CartItem[];
  total: number;
}
