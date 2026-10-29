import { getDemoResponse, isDemoCatalogPath } from './demoData.js';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const demoModeListeners = new Set();
let demoCatalogActive = false;

export const isDemoCatalogActive = () => demoCatalogActive;
export const subscribeToDemoCatalog = listener => {
  demoModeListeners.add(listener);
  if (demoCatalogActive) listener();
  return () => demoModeListeners.delete(listener);
};

const activateDemoCatalog = () => {
  if (demoCatalogActive) return;
  demoCatalogActive = true;
  demoModeListeners.forEach(listener => listener());
};

const demoResponse = path => {
  activateDemoCatalog();
  const result = getDemoResponse(path);
  if (result === null) throw new Error('المنتج غير موجود.');
  if (result === undefined) throw new Error('حدث خطأ، حاول مرة أخرى');
  return result;
};

export async function api(path, { method = 'GET', body, token } = {}) {
  const requestMethod = method.toUpperCase();
  const demoEligible = requestMethod === 'GET' && isDemoCatalogPath(path);
  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api${path}`, {
      method: requestMethod,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body && JSON.stringify(body),
    });
  } catch (error) {
    if (demoEligible) return demoResponse(path);
    throw error;
  }

  if (demoEligible && [404, 502, 503, 504].includes(res.status)) return demoResponse(path);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'حدث خطأ، حاول مرة أخرى');
  return data;
}
export const egp = (n) => `EGP ${Number(n).toLocaleString('en-US')}`;
