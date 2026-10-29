import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, egp } from '../api.js';
import { Chat, Close } from './Icons.jsx';
import { productName } from '../i18n.js';
import { useStore } from '../store.jsx';

const QUICK_PROMPTS = {
  ar: ['طرق الدفع', 'حالة الطلب', 'الشحن والتوصيل', 'منتجات الذهب'],
  en: ['Payment methods', 'Order status', 'Shipping and delivery', 'Gold jewelry'],
};

const normalize = text => text.toLocaleLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').trim();

export default function ChatBot() {
  const { language } = useStore();
  const en = language === 'en';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState(() => [{
    from: 'bot',
    text: en ? 'Hello! I’m Lavina AI. How can I help you today?' : 'أهلاً بك! أنا لافينا AI، كيف أقدر أساعدك؟',
  }]);
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  const answer = async question => {
    const text = question.trim();
    if (!text || busy) return;
    setInput('');
    setMessages(current => [...current, { from: 'user', text }]);
    setBusy(true);
    const q = normalize(text);
    let reply;
    try {
      if (/طلب|اوردر|order|track|تتبع/.test(q)) {
        reply = en
          ? 'You can view your order status in My Account → My Orders after signing in.'
          : 'تقدر تتابع حالة طلبك من حسابي ← طلباتي بعد تسجيل الدخول.';
      } else if (/دفع|فوري|انستا|instapay|fawry|payment|pay/.test(q)) {
        reply = en
          ? 'Available payment methods are Fawry, InstaPay, and cash on delivery. Your order is sent for admin approval first.'
          : 'طرق الدفع المتاحة: فوري، إنستا باي، والدفع عند الاستلام. الطلب بيتبعت للأدمن للمراجعة أولاً.';
      } else if (/شحن|توصيل|delivery|shipping/.test(q)) {
        reply = en
          ? 'Delivery is free on all orders. Enter your governorate, city, and full address at checkout.'
          : 'التوصيل مجاني لجميع الطلبات. اكتب المحافظة والمدينة والعنوان بالتفصيل عند إتمام الشراء.';
      } else if (/ارجاع|استبدال|استرداد|return|refund|exchange/.test(q)) {
        reply = en
          ? 'For return or exchange questions, please contact Lavina customer service so the team can help with your order.'
          : 'للاستفسار عن الإرجاع أو الاستبدال، تواصل مع خدمة عملاء لافينا لمساعدتك في طلبك.';
      } else if (/فرع|فروع|موقع|عنوان|ساعات|location|store|branch|hours/.test(q)) {
        reply = en
          ? 'Store locations, contact details, and opening hours are listed in the Visit Our Stores section at the bottom of the page.'
          : 'هتلاقي عناوين الفروع وبيانات التواصل ومواعيد العمل في قسم «زورونا في فروعنا» أسفل الصفحة.';
      } else if (/ذهب|الماس|الفضه|خاتم|سلسله|اسوره|earring|ring|necklace|bracelet|gold|diamond|silver/.test(q)) {
        const products = await api(`/products?q=${encodeURIComponent(text)}&limit=4`);
        reply = products.length
          ? { text: en ? 'Here are some pieces you may like:' : 'دي بعض القطع اللي ممكن تعجبك:', products }
          : (en ? 'I couldn’t find a close match. Try searching from the search bar for more results.' : 'ملقتش منتجات قريبة من بحثك. جرب تستخدم خانة البحث عشان تشوف نتائج أكتر.');
      } else {
        reply = en
          ? 'I can help with products, payment methods, delivery, order status, returns, and store locations. What would you like to know?'
          : 'أقدر أساعدك في المنتجات، طرق الدفع، التوصيل، حالة الطلب، الإرجاع، وعناوين الفروع. تحب تعرف إيه؟';
      }
    } catch (error) {
      reply = en
        ? `I couldn’t load product suggestions right now (${error.message}). Please try the search bar.`
        : `تعذر تحميل اقتراحات المنتجات الآن (${error.message}). جرب خانة البحث من فضلك.`;
    } finally {
      setBusy(false);
    }
    setMessages(current => [...current, { from: 'bot', ...(typeof reply === 'string' ? { text: reply } : reply) }]);
  };

  return (
    <div className="lavina-chat">
      {open && <section className="chat-panel" aria-label="Lavina AI" aria-live="polite">
        <header className="chat-head">
          <div><strong>Lavina AI</strong><small>{en ? 'Jewelry shopping assistant' : 'مساعدك للتسوق من لافينا'}</small></div>
          <button type="button" onClick={() => setOpen(false)} aria-label={en ? 'Close chat' : 'إغلاق المحادثة'}><Close /></button>
        </header>
        <div className="chat-messages" role="log" aria-relevant="additions">
          {messages.map((message, index) => (
            <div className={`chat-message ${message.from}`} key={index}>
              <p>{message.text}</p>
              {message.products?.map(product => (
                <Link className="chat-product" to={`/p/${product.id}`} key={product.id} onClick={() => setOpen(false)}>
                  <img src={product.images[0]} alt="" />
                  <span>{productName(product, language)}<small>{egp(product.final_price)}</small></span>
                </Link>
              ))}
            </div>
          ))}
          {busy && <p className="chat-typing">{en ? 'Lavina AI is typing…' : 'لافينا AI بيكتب…'}</p>}
          <div ref={messagesEnd} />
        </div>
        {messages.length === 1 && <div className="chat-prompts">
          {QUICK_PROMPTS[language].map(prompt => <button key={prompt} type="button" onClick={() => answer(prompt)}>{prompt}</button>)}
        </div>}
        <form className="chat-form" onSubmit={event => { event.preventDefault(); answer(input); }}>
          <input value={input} onChange={event => setInput(event.target.value)} placeholder={en ? 'Write your message…' : 'اكتب رسالتك…'} aria-label={en ? 'Message' : 'الرسالة'} />
          <button type="submit" disabled={busy || !input.trim()}>{en ? 'Send' : 'إرسال'}</button>
        </form>
      </section>}
      <button className="chat-launcher" type="button" onClick={() => setOpen(value => !value)}
        aria-label={open ? (en ? 'Close Lavina AI' : 'إغلاق لافينا AI') : (en ? 'Chat with Lavina AI' : 'تحدث مع لافينا AI')}
        aria-expanded={open}>
        {open ? <Close /> : <Chat />}
        {!open && <span>Lavina AI</span>}
      </button>
    </div>
  );
}
