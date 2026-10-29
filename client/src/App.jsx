import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Drawers from './components/Drawers.jsx';
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import Listing from './pages/Listing.jsx';
import Product from './pages/Product.jsx';
import Admin from './pages/Admin.jsx';
import Checkout from './pages/Checkout.jsx';
import ChatBot from './components/ChatBot.jsx';
import { useStore } from './store.jsx';
import { t } from './i18n.js';

export default function App() {
  const { pathname } = useLocation();
  const { language } = useStore();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/account" element={<Auth />} />
          <Route path="/c/:slug" element={<Listing />} />
          <Route path="/shop" element={<Listing />} />
          <Route path="/p/:id" element={<Product />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<p className="wrap empty">{t('الصفحة غير موجودة.', language)}</p>} />
        </Routes>
      </main>
      <Footer />
      <Drawers />
      <ChatBot />
    </>
  );
}
