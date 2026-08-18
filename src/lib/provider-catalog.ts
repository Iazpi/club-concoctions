import raw from "./provider-items.json";

export type ShoppingList = "bodega" | "menaje";

export interface ProviderItem {
  code: string;
  name: string;
  family: string;
  subfamily: string;
  price: number; // IVA incluido
  list: ShoppingList;
}

const MENAJE_FAMILIES = new Set([
  "VAJILLA",
  "PLASTICO",
  "LIMPIEZA, PAPEL Y UTENSILIOS",
  "FILM, ALUMINIO Y ENVASES",
  "BOLSAS DE BASURA",
  "PALILLOS",
  "NAIPES",
]);

export const LIST_LABEL: Record<ShoppingList, string> = {
  bodega: "Bodeguero",
  menaje: "Menaje y otros",
};

export const PROVIDER_ITEMS: ProviderItem[] = (raw as [string, string, string, string, number][]).map(
  ([code, name, family, subfamily, price]) => ({
    code,
    name,
    family,
    subfamily,
    price,
    list: MENAJE_FAMILIES.has(family) ? "menaje" : "bodega",
  }),
);

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function searchProvider(list: ShoppingList, query: string, limit = 25): ProviderItem[] {
  const q = norm(query.trim());
  if (q.length < 2) return [];
  const terms = q.split(/\s+/);
  const out: ProviderItem[] = [];
  for (const it of PROVIDER_ITEMS) {
    if (it.list !== list) continue;
    const hay = norm(it.name);
    if (terms.every((t) => hay.includes(t))) {
      out.push(it);
      if (out.length >= limit) break;
    }
  }
  return out;
}
