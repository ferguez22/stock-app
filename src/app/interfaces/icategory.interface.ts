export interface ICategory {
  id?: number;
  name: string;
  description?: string;
  parent_id?: number | null;
  parent_name?: string; // viene del JOIN en la API
  product_count?: number;
}