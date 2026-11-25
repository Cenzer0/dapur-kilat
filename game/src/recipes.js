// The menu: what a warung serves, and what each dish needs. An ingredient is
// either instant (scooped straight onto the plate) or prepped (chopped on the
// board, cooked in a pan) before it can be plated. A dish lists its ingredients
// in the order they are plated, so the ticket reads as a recipe.
export const INGREDIENTS = {
  nasi: { id: 'nasi', name: 'Nasi', prep: 'instant', color: '#fff7e0', dark: '#d9c48f' },
  mie: { id: 'mie', name: 'Mie', prep: 'instant', color: '#fbbf24', dark: '#b45309' },
  ayam: { id: 'ayam', name: 'Ayam', prep: 'chop-cook', chops: 3, cook: 5, burn: 8, color: '#f59e0b', dark: '#92400e' },
  telur: { id: 'telur', name: 'Telur', prep: 'cook', cook: 3, burn: 6, color: '#fef3c7', dark: '#b45309' },
  sayur: { id: 'sayur', name: 'Sayur', prep: 'chop', chops: 2, color: '#4ade80', dark: '#166534' },
  sambal: { id: 'sambal', name: 'Sambal', prep: 'instant', color: '#ef4444', dark: '#7f1d1d' },
  kerupuk: { id: 'kerupuk', name: 'Kerupuk', prep: 'instant', color: '#fda4af', dark: '#9f1239' },
};

// Bin order on the counter, left to right.
export const BIN_ORDER = ['nasi', 'mie', 'ayam', 'telur', 'sayur', 'sambal', 'kerupuk'];

export const DISHES = [
  { id: 'nasgor', name: 'Nasi Goreng', items: ['nasi', 'telur', 'sambal', 'kerupuk'], base: 100 },
  { id: 'mieayam', name: 'Mie Ayam', items: ['mie', 'ayam', 'sayur'], base: 120 },
  { id: 'soto', name: 'Soto Ayam', items: ['nasi', 'ayam', 'telur'], base: 130 },
  { id: 'geprek', name: 'Ayam Geprek', items: ['nasi', 'ayam', 'sambal'], base: 120 },
  { id: 'miegoreng', name: 'Mie Goreng', items: ['mie', 'telur', 'sayur', 'sambal'], base: 110 },
  { id: 'nasitelur', name: 'Nasi Telur', items: ['nasi', 'telur', 'kerupuk'], base: 90 },
];

export function ingredient(id) {
  return INGREDIENTS[id];
}

export function dishById(id) {
  return DISHES.find((d) => d.id === id) || DISHES[0];
}

/** What the plate still needs for an order: the next ingredient id, or null. */
export function nextNeeded(order) {
  return order.placed.length < order.items.length ? order.items[order.placed.length] : null;
}

export function orderComplete(order) {
  return order.placed.length >= order.items.length;
}
