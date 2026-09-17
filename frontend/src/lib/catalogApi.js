export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path) {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error("Katalog verisi şu anda alınamıyor.");
  return response.json();
}

export function getProducts(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) params.set(key, value);
  });
  return request(`/api/products?${params}`);
}

export function getProduct(id) { return request(`/api/products/${encodeURIComponent(id)}`); }
export function getCategories() { return request("/api/categories"); }
export function getCategoryBySlug(slug) { return request(`/api/categories/${encodeURIComponent(slug)}`); }
export const WHATSAPP_URL = "https://wa.me/905446176144";
export const COMPANY_CONTACT = {
  phoneDisplay: "0212 442 49 16",
  phoneUrl: "tel:+902124424916",
  email: "info@onfitek.com.tr",
  website: "https://www.onfitek.com.tr",
  websiteDisplay: "www.onfitek.com.tr",
  addressLine1: "Siyavuşpaşa Mah. Sultan Selim Cad.",
  addressLine2: "Atak Ap. No: 13A, Bahçelievler / İstanbul",
};
