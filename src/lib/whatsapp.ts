// Teléfonos de aviso (formato internacional sin "+")
export const WA_COMPRAS = "34625783260";
export const WA_RESERVAS = "34654852940";

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
