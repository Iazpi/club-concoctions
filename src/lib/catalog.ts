export type Category =
  | "SIN ALCOHOL"
  | "CERVEZA / SIDRA"
  | "VINO"
  | "VERMUT / APERITIVO"
  | "COMBINADOS"
  | "CAVA / CHAMPAGNE"
  | "APERITIVOS"
  | "COMIDAS Y CENAS";

export interface Product {
  id: string;
  name: string;
  category: Category;
  socio: number;
  noSocio: number;
  info?: string;
}

const p = (
  id: string,
  name: string,
  category: Category,
  socio: number,
  noSocio: number,
  info?: string,
): Product => ({ id, name, category, socio, noSocio, info });

export const PRODUCTS: Product[] = [
  p("agua-peq", "Agua pequeña (50 cl)", "SIN ALCOHOL", 0.5, 1, "Cuevas / Cabreiroa"),
  p("agua-gr", "Agua grande (1,5 L)", "SIN ALCOHOL", 1, 1.5, "Cuevas 1,5 L"),
  p("refresco", "Refresco / Tónica (lata)", "SIN ALCOHOL", 1, 1.5, "Coca-Cola, Kas, Aquarius, Nestea, Schweppes"),
  p("zumo", "Zumo / Mosto", "SIN ALCOHOL", 1, 1.5, "Auara (naranja, melocotón, piña), Mosto Auara"),
  p("gaseosa", "Gaseosa", "SIN ALCOHOL", 1, 1.5, "La Casera"),
  p("cafe", "Café", "SIN ALCOHOL", 1, 1.5),
  p("cafe-licor", "Café + Licor", "SIN ALCOHOL", 3, 3.5),

  p("cana", "Caña (vaso pequeño)", "CERVEZA / SIDRA", 1, 1.5, "Barril E-Galicia"),
  p("canon", "Cañón (vaso grande)", "CERVEZA / SIDRA", 1.5, 2, "Barril E-Galicia"),
  p("botellin", "Botellín / lata (33 cl)", "CERVEZA / SIDRA", 1.5, 2, "1906 Reserva, B-Lemon"),
  p("alhambra", "Botellín Alhambra 1925", "CERVEZA / SIDRA", 1.5, 2.5, "Alhambra 1925"),
  p("sidra", "Sidra natural (botella)", "CERVEZA / SIDRA", 3, 4, "Gurutzeta"),

  p("copa-vino", "Copa de vino (de la casa)", "VINO", 1.5, 2, "Inurrieta 400 / Orchidea Blanco"),
  p("bot-casa", "Botella vino DE LA CASA", "VINO", 9, 13, "Inurrieta 400, Orchidea Blanco, Frizzante 61"),
  p("bot-premium", "Botella vino PREMIUM", "VINO", 18, 24, "Pago Cirsus, Fagus Coto de Hayas, Mar de Frades"),
  p("tinto-verano", "Tinto de verano", "VINO", 2, 3),
  p("calimocho", "Calimocho", "VINO", 2, 3, "Vino de la casa + Coca-Cola"),

  p("vermut", "Vermut (copa)", "VERMUT / APERITIVO", 2, 3, "Yzaguirre"),
  p("spritz", "Aperol / Campari (spritz)", "VERMUT / APERITIVO", 3, 4),

  p("cubata-casa", "Cubata DE LA CASA", "COMBINADOS", 3, 5, "Seagram's, Bulldog, Brugal, Absolut, White Label…"),
  p("cubata-premium", "Cubata PREMIUM", "COMBINADOS", 4, 6, "Nordés, Brockmans, Zacapa 23"),
  p("pacharan", "Pacharán", "COMBINADOS", 2.5, 3.5),
  p("chupito", "Chupito", "COMBINADOS", 1, 1.5, "Orujos, licores, pacharán"),
  p("chupito-premium", "Chupito premium", "COMBINADOS", 1.5, 2, "Don Julio Reposado, Zacapa 23"),

  p("cava", "Cava / espumoso (botella)", "CAVA / CHAMPAGNE", 5, 7, "Frizzante 61"),
  p("taittinger", "Champagne Taittinger (botella)", "CAVA / CHAMPAGNE", 55, 70),
  p("veuve", "Champagne Veuve Clicquot (botella)", "CAVA / CHAMPAGNE", 60, 75),

  p("patatas", "Patatas / snacks (bolsa)", "APERITIVOS", 0.5, 1.5),
  p("aceitunas", "Aceitunas (ración)", "APERITIVOS", 0.5, 1.5, "Hechizos del Sur"),
  p("frutos", "Frutos secos (ración)", "APERITIVOS", 0.5, 1.5, "Mezcladitos"),
  p("encurtidos", "Encurtidos (ración)", "APERITIVOS", 0.5, 1.5),

  p("comensal", "Servicio por comensal", "COMIDAS Y CENAS", 1, 1),
];

export const CATEGORIES: Category[] = [
  "SIN ALCOHOL",
  "CERVEZA / SIDRA",
  "VINO",
  "VERMUT / APERITIVO",
  "COMBINADOS",
  "CAVA / CHAMPAGNE",
  "APERITIVOS",
  "COMIDAS Y CENAS",
];

export const CLEANING_COST = 24;

export const getProduct = (id: string) => PRODUCTS.find((x) => x.id === id);
export const price = (prod: Product, socio: boolean) => (socio ? prod.socio : prod.noSocio);
export const fmt = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;
