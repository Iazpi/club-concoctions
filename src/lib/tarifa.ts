export type Producto = {
  id: string;
  nombre: string;
  marcas: string;
  precio: number;
  precioSocio: number;
  icono: string;
};

export type Categoria = {
  id: string;
  nombre: string;
  icono: string;
  /** Clases de color para la pestaña activa y los acentos de la categoría. */
  color: {
    activo: string;
    inactivo: string;
    acento: string;
    badge: string;
  };
  productos: Producto[];
};

// Tarifa BARRO CB (definitiva). `precio` = tarifa NO SOCIO, `precioSocio` = tarifa socio.
export const CATEGORIAS: Categoria[] = [
  {
    id: "sin-alcohol",
    nombre: "Sin alcohol",
    icono: "💦",
    color: {
      activo: "bg-cat-agua text-clay-800",
      inactivo: "border border-cat-agua/40 bg-cat-agua/15 text-clay-800",
      acento: "text-cat-agua-ink",
      badge: "bg-cat-agua text-clay-800",
    },
    productos: [
      { id: "agua-p", nombre: "Agua pequeña", marcas: "Cuevas / Cabreiroa · 50 cl", precio: 1, precioSocio: 0.5, icono: "💦" },
      { id: "agua-g", nombre: "Agua grande", marcas: "Cuevas 1,5 L", precio: 1.5, precioSocio: 1, icono: "🚰" },
      {
        id: "refresco",
        nombre: "Refresco / Tónica (lata)",
        marcas: "Coca-Cola, Kas, Aquarius, Nestea, Schweppes",
        precio: 1.5,
        precioSocio: 1,
        icono: "🥤",
      },
      {
        id: "zumo",
        nombre: "Zumo / Mosto",
        marcas: "Auara (naranja, melocotón, piña), Mosto Auara",
        precio: 1.5,
        precioSocio: 1,
        icono: "🧃",
      },
      { id: "gaseosa", nombre: "Gaseosa", marcas: "La Casera", precio: 1.5, precioSocio: 1, icono: "🫧" },
      { id: "cafe", nombre: "Café", marcas: "Solo, cortado, con leche", precio: 1.5, precioSocio: 1, icono: "☕" },
      { id: "cafe-licor", nombre: "Café + Licor", marcas: "Carajillo", precio: 3.5, precioSocio: 3, icono: "☕" },
    ],
  },
  {
    id: "cerveza",
    nombre: "Cerveza / Sidra",
    icono: "🍺",
    color: {
      activo: "bg-cat-cerveza text-clay-800",
      inactivo: "border border-cat-cerveza/40 bg-cat-cerveza/15 text-clay-800",
      acento: "text-cat-cerveza-ink",
      badge: "bg-cat-cerveza text-clay-800",
    },
    productos: [
      { id: "cana", nombre: "Caña", marcas: "Barril E-Galicia · vaso pequeño", precio: 1.5, precioSocio: 1, icono: "🍺" },
      { id: "canon", nombre: "Cañón", marcas: "Barril E-Galicia · vaso grande", precio: 2, precioSocio: 1.5, icono: "🍻" },
      { id: "botellin", nombre: "Botellín / Lata", marcas: "1906 Reserva, B-Lemon · 33 cl", precio: 2, precioSocio: 1.5, icono: "🍾" },
      { id: "alhambra", nombre: "Botellín Alhambra", marcas: "Alhambra 1925", precio: 2.5, precioSocio: 1.5, icono: "🍺" },
      { id: "sidra", nombre: "Sidra natural", marcas: "Gurutzeta · botella", precio: 4, precioSocio: 3, icono: "🍏" },
    ],
  },
  {
    id: "vino",
    nombre: "Vino",
    icono: "🍷",
    color: {
      activo: "bg-cat-vino text-clay-100",
      inactivo: "border border-cat-vino/40 bg-cat-vino/15 text-clay-800",
      acento: "text-cat-vino-ink",
      badge: "bg-cat-vino text-clay-100",
    },
    productos: [
      {
        id: "copa-vino",
        nombre: "Copa de vino",
        marcas: "Inurrieta 400 joven, Inurrieta Orchidea Blanco",
        precio: 2,
        precioSocio: 1.5,
        icono: "🍷",
      },
      {
        id: "botella-casa",
        nombre: "Botella DE LA CASA",
        marcas: "Inurrieta 400 joven, Orchidea Blanco, Frizzante 61",
        precio: 13,
        precioSocio: 9,
        icono: "🍾",
      },
      {
        id: "botella-premium",
        nombre: "Botella PREMIUM",
        marcas: "Pago Cirsus Cuvée Especial, Fagus Coto de Hayas, Albariño Mar de Frades",
        precio: 24,
        precioSocio: 18,
        icono: "🥂",
      },
      {
        id: "botella-inurrieta-400",
        nombre: "Botella Inurrieta 400 (superior)",
        marcas: "Añada más cara",
        precio: 30,
        precioSocio: 26,
        icono: "🍷",
      },
      { id: "tinto-verano", nombre: "Tinto de verano", marcas: "Al limón", precio: 3, precioSocio: 2, icono: "🍹" },
      { id: "calimocho", nombre: "Calimocho", marcas: "Vino de la casa + Coca-Cola", precio: 3, precioSocio: 2, icono: "🥃" },
    ],
  },
  {
    id: "vermut",
    nombre: "Vermut / Aperitivo",
    icono: "🍹",
    color: {
      activo: "bg-cat-vermut text-clay-800",
      inactivo: "border border-cat-vermut/40 bg-cat-vermut/15 text-clay-800",
      acento: "text-cat-vermut-ink",
      badge: "bg-cat-vermut text-clay-800",
    },
    productos: [
      { id: "vermut", nombre: "Vermut (copa)", marcas: "Yzaguirre rojo, blanco, reserva", precio: 3, precioSocio: 2, icono: "🍹" },
      { id: "spritz", nombre: "Aperol / Campari", marcas: "Spritz", precio: 4, precioSocio: 3, icono: "🍊" },
    ],
  },
  {
    id: "combinados",
    nombre: "Combinados",
    icono: "🥃",
    color: {
      activo: "bg-cat-combinados text-clay-100",
      inactivo: "border border-cat-combinados/40 bg-cat-combinados/15 text-clay-800",
      acento: "text-cat-combinados-ink",
      badge: "bg-cat-combinados text-clay-100",
    },
    productos: [
      {
        id: "cubata-casa",
        nombre: "Cubata DE LA CASA",
        marcas: "Seagram's, Bulldog, London Nº1, Brugal Añejo, Barceló Añejo, Absolut, White Label",
        precio: 5,
        precioSocio: 3,
        icono: "🥤",
      },
      {
        id: "cubata-premium",
        nombre: "Cubata PREMIUM",
        marcas: "Nordés, Brockmans Premium, Ron Zacapa 23",
        precio: 6,
        precioSocio: 4,
        icono: "🍸",
      },
      { id: "pacharan", nombre: "Pacharán", marcas: "—", precio: 3.5, precioSocio: 2.5, icono: "🫐" },
      { id: "chupito", nombre: "Chupito", marcas: "Orujos, licores, pacharán", precio: 1.5, precioSocio: 1, icono: "🥃" },
      {
        id: "chupito-premium",
        nombre: "Chupito premium",
        marcas: "Tequila Don Julio Reposado, Ron Zacapa 23",
        precio: 2,
        precioSocio: 1.5,
        icono: "🌵",
      },
    ],
  },
  {
    id: "cava",
    nombre: "Cava / Champagne",
    icono: "🍾",
    color: {
      activo: "bg-cat-cava text-clay-800",
      inactivo: "border border-cat-cava/40 bg-cat-cava/15 text-clay-800",
      acento: "text-cat-cava-ink",
      badge: "bg-cat-cava text-clay-800",
    },
    productos: [
      { id: "cava", nombre: "Cava / Espumoso", marcas: "Frizzante 61 · botella", precio: 7, precioSocio: 5, icono: "🍾" },
      {
        id: "taittinger",
        nombre: "Champagne Taittinger",
        marcas: "Taittinger Brut Réserve · botella",
        precio: 70,
        precioSocio: 55,
        icono: "🥂",
      },
      {
        id: "veuve",
        nombre: "Champagne Veuve Clicquot",
        marcas: "Veuve Clicquot Brut · botella",
        precio: 75,
        precioSocio: 60,
        icono: "✨",
      },
    ],
  },
  {
    id: "aperitivos",
    nombre: "Picoteo",
    icono: "🥨",
    color: {
      activo: "bg-cat-picoteo text-clay-800",
      inactivo: "border border-cat-picoteo/40 bg-cat-picoteo/15 text-clay-800",
      acento: "text-cat-picoteo-ink",
      badge: "bg-cat-picoteo text-clay-800",
    },
    productos: [
      { id: "patatas", nombre: "Patatas / Snacks", marcas: "Bolsa", precio: 1.5, precioSocio: 0.5, icono: "🍟" },
      { id: "aceitunas", nombre: "Aceitunas", marcas: "Hechizos del Sur · ración", precio: 1.5, precioSocio: 0.5, icono: "🫒" },
      { id: "frutos", nombre: "Frutos secos", marcas: "Mezcladitos · ración", precio: 1.5, precioSocio: 0.5, icono: "🥜" },
      {
        id: "encurtidos",
        nombre: "Encurtidos",
        marcas: "Pepinillos, cebolleta, cóctel encurtido",
        precio: 1.5,
        precioSocio: 0.5,
        icono: "🥒",
      },
    ],
  },
];

export const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
