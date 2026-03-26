// Soporta subcategorías mediante parent_id (relación consigo misma)
export interface ICategory {
  id?: number;              // AUTO_INCREMENT
  name: string;             // Nombre de la categoría (ej: "Audio", "Video")
  description?: string;
  parent_id?: number | null; // Si es null = categoría principal, si tiene valor = subcategoría
  created_at?: string;
  updated_at?: string;

  // Dato populado: cuando la API devuelve las subcategorías anidadas
  children?: ICategory[];
}