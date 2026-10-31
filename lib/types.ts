/** Shared domain types. */

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_inr: number;
  image_url: string;
  category: string;
  is_active: boolean;
  /** Optional product gallery (JSONB array of image paths). */
  gallery_urls?: string[];
};

/** Row shape returned by the admin orders list endpoint. */
export type AdminOrderRow = {
  id: number;
  public_ref: string;
  customer_name: string;
  phone: string;
  product_name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type OrderNote = {
  id: number;
  order_request_id: number;
  note: string;
  created_at: string;
  created_by: string;
};
