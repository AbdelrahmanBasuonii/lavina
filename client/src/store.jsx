import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

export function Store({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => load('user', null));
  const [cart, setCart] = useState(() => load('cart', []));      // [{product, quantity}]
  const [wish, setWish] = useState([]);                          // product ids
  const [drawer, setDrawer] = useState(null);                    // 'cart' | 'menu' | 'account' | null
  const [language, setLanguage] = useState(() => localStorage.getItem('language') === 'en' ? 'en' : 'ar');

  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.title = language === 'ar' ? 'لافينا للمجوهرات' : 'Lavina Jewelry';
    localStorage.setItem('language', language);
  }, [language]);

  const login = useCallback((t, u) => {
    localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u));
    setToken(t); setUser(u);
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setToken(null); setUser(null); setWish([]);
  }, []);
  const toggleLanguage = useCallback(() => {
    setLanguage(current => current === 'ar' ? 'en' : 'ar');
  }, []);

  useEffect(() => {
    if (!token) return;
    api('/wishlist', { token }).then(l => setWish(l.map(p => p.id))).catch(logout);
  }, [token, logout]);

  const addToCart = (product, quantity = 1) => {
    setCart(c => {
      const hit = c.find(i => i.product.id === product.id);
      return hit ? c.map(i => i.product.id === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, 10) } : i)
                 : [...c, { product, quantity }];
    });
    setDrawer('cart');
  };
  const setQty = (id, q) => setCart(c => q < 1 ? c.filter(i => i.product.id !== id) : c.map(i => i.product.id === id ? { ...i, quantity: q } : i));
  const toggleWish = async (id) => {
    if (!token) return setDrawer('account');
    const on = wish.includes(id);
    setWish(w => on ? w.filter(x => x !== id) : [...w, id]);
    api(`/wishlist/${id}`, { method: on ? 'DELETE' : 'PUT', token }).catch(() => {});
  };
  const cartCount = cart.reduce((n, i) => n + i.quantity, 0);
  const cartTotal = cart.reduce((n, i) => n + i.quantity * i.product.final_price, 0);

  return (
    <Ctx.Provider value={{ token, user, login, logout, cart, addToCart, setQty, setCart, cartCount, cartTotal, wish, toggleWish, drawer, setDrawer, language, toggleLanguage }}>
      {children}
    </Ctx.Provider>
  );
}
