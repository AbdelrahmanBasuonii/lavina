import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api.js';
import { useStore } from '../store.jsx';

const DAYS = [
  ['saturday', 'السبت', 'Saturday'], ['sunday', 'الأحد', 'Sunday'],
  ['monday', 'الإثنين', 'Monday'], ['tuesday', 'الثلاثاء', 'Tuesday'],
  ['wednesday', 'الأربعاء', 'Wednesday'], ['thursday', 'الخميس', 'Thursday'],
  ['friday', 'الجمعة', 'Friday'],
];
const emptyProduct = () => ({
  sku: '', name: '', name_en: '', description: '', category_id: '',
  item_type: 'ring', karat: '', weight_g: '', price: '', discount_percent: 0,
  stock: 0, images: [], is_best_seller: false, is_new: true, is_active: true,
});
const emptyStore = () => ({
  name: '', address: '', phone: '', location_url: '', images: [],
  opening_hours: Object.fromEntries(DAYS.map(([key]) => [key, ''])),
});
const readFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('تعذر قراءة الصورة'));
  reader.readAsDataURL(file);
});

export default function Admin() {
  const { token, user, language } = useStore();
  const en = language === 'en';
  const L = (ar, english) => en ? english : ar;
  const [section, setSection] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(emptyProduct);
  const [store, setStore] = useState(emptyStore);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingStore, setEditingStore] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [visibleCounts, setVisibleCounts] = useState({
    orders: 10, products: 10, reviews: 10, stores: 10,
  });
  const visibleItems = (items, key) => items.slice(0, visibleCounts[key]);
  const moreItems = (items, key) => (
    <div className="admin-more">
      <small>{L(`عرض ${Math.min(visibleCounts[key], items.length)} من ${items.length}`, `Showing ${Math.min(visibleCounts[key], items.length)} of ${items.length}`)}</small>
      {visibleCounts[key] < items.length && (
        <button className="btn line" onClick={() => setVisibleCounts(current => ({
          ...current, [key]: current[key] + 10,
        }))}>{L('المزيد', 'More')}</button>
      )}
    </div>
  );

  const loadData = async () => {
    setError('');
    try {
      const [orderRows, productRows, reviewRows, storeRows, categoryRows] = await Promise.all([
        api('/admin/orders', { token }), api('/admin/products', { token }),
        api('/admin/reviews', { token }), api('/admin/stores', { token }),
        api('/categories'),
      ]);
      setOrders(orderRows); setProducts(productRows); setReviews(reviewRows);
      setStores(storeRows); setCategories(categoryRows);
    } catch (ex) { setError(ex.message); }
  };
  useEffect(() => { if (user?.role === 'admin') loadData(); }, [token, user?.role]);

  if (user?.role !== 'admin') return <Navigate to="/account" replace />;
  const notifyError = ex => { setError(ex.message); setMessage(''); };
  const notifySuccess = text => { setMessage(text); setError(''); };
  const setProductField = (key, value) => setProduct(current => ({ ...current, [key]: value }));
  const setStoreField = (key, value) => setStore(current => ({ ...current, [key]: value }));

  const uploadImages = async (files, onDone) => {
    if (!files.length) return;
    setBusy(true); setError('');
    try {
      const uploaded = [];
      for (const file of files) {
        const data = await readFile(file);
        const result = await api('/admin/uploads', { method: 'POST', token, body: { data } });
        uploaded.push(result.url);
      }
      onDone(uploaded);
    } catch (ex) { notifyError(ex); }
    finally { setBusy(false); }
  };

  const submitProduct = async event => {
    event.preventDefault(); setBusy(true);
    const body = {
      ...product,
      category_id: Number(product.category_id),
      karat: product.karat === '' ? null : Number(product.karat),
      weight_g: product.weight_g === '' ? null : Number(product.weight_g),
      price: Number(product.price), discount_percent: Number(product.discount_percent),
      stock: Number(product.stock),
    };
    try {
      if (editingProduct) await api(`/admin/products/${editingProduct}`, { method: 'PUT', token, body });
      else await api('/admin/products', { method: 'POST', token, body });
      setProduct(emptyProduct()); setEditingProduct(null);
      notifySuccess(L('تم حفظ المنتج بنجاح.', 'Product saved successfully.'));
      await loadData();
    } catch (ex) { notifyError(ex); }
    finally { setBusy(false); }
  };

  const editProduct = item => {
    setEditingProduct(item.id);
    setProduct({
      sku: item.sku, name: item.name, name_en: item.name_en || '',
      description: item.description, category_id: String(item.category_id),
      item_type: item.item_type, karat: item.karat ?? '', weight_g: item.weight_g ?? '',
      price: item.price, discount_percent: item.discount_percent, stock: item.stock,
      images: item.images, is_best_seller: !!item.is_best_seller,
      is_new: !!item.is_new, is_active: !!item.is_active,
    });
    setSection('products');
    window.scrollTo(0, 0);
  };

  const saveOrderStatus = async (id, status) => {
    setBusy(true);
    try {
      await api(`/admin/orders/${id}`, { method: 'PATCH', token, body: { status } });
      notifySuccess(L('تم تحديث حالة الطلب.', 'Order status updated.'));
      await loadData();
    } catch (ex) { notifyError(ex); }
    finally { setBusy(false); }
  };
  const updateReview = async (review, approved) => {
    setBusy(true);
    try {
      await api(`/admin/reviews/${review.id}`, { method: 'PATCH', token, body: { is_approved: approved } });
      await loadData();
    } catch (ex) { notifyError(ex); }
    finally { setBusy(false); }
  };
  const deleteReview = async review => {
    if (!window.confirm(L('هل تريد حذف هذا التقييم نهائيًا؟', 'Delete this review permanently?'))) return;
    setBusy(true);
    try { await api(`/admin/reviews/${review.id}`, { method: 'DELETE', token }); await loadData(); }
    catch (ex) { notifyError(ex); }
    finally { setBusy(false); }
  };

  const editStore = item => {
    setEditingStore(item.id);
    setStore({ ...emptyStore(), ...item, opening_hours: { ...emptyStore().opening_hours, ...item.opening_hours } });
    setSection('stores');
  };
  const submitStore = async event => {
    event.preventDefault(); setBusy(true);
    try {
      const body = { ...store, phone: store.phone || '', location_url: store.location_url || '' };
      if (editingStore) await api(`/admin/stores/${editingStore}`, { method: 'PUT', token, body });
      else await api('/admin/stores', { method: 'POST', token, body });
      setStore(emptyStore()); setEditingStore(null);
      notifySuccess(L('تم حفظ بيانات الفرع.', 'Store details saved.'));
      await loadData();
    } catch (ex) { notifyError(ex); }
    finally { setBusy(false); }
  };
  const deleteStore = async item => {
    if (!window.confirm(L('حذف هذا الفرع؟', 'Delete this store?'))) return;
    try { await api(`/admin/stores/${item.id}`, { method: 'DELETE', token }); await loadData(); }
    catch (ex) { notifyError(ex); }
  };
  const deleteProduct = async item => {
    if (!window.confirm(L('إخفاء هذا المنتج من المتجر؟', 'Hide this product from the store?'))) return;
    try {
      const body = {
        sku: item.sku, name: item.name, name_en: item.name_en || '', description: item.description,
        category_id: item.category_id, item_type: item.item_type, karat: item.karat,
        weight_g: item.weight_g, price: item.price, discount_percent: item.discount_percent,
        stock: item.stock, images: item.images, is_best_seller: !!item.is_best_seller,
        is_new: !!item.is_new, is_active: false,
      };
      await api(`/admin/products/${item.id}`, { method: 'PUT', token, body });
      await loadData();
    } catch (ex) { notifyError(ex); }
  };

  const tabs = [
    ['orders', L('الطلبات', 'Orders'), orders.length],
    ['products', L('المنتجات', 'Products'), products.length],
    ['reviews', L('التقييمات', 'Reviews'), reviews.length],
    ['stores', L('الفروع ومواعيد العمل', 'Stores & hours'), stores.length],
  ];
  const statusLabel = status => ({
    pending: L('بانتظار الموافقة', 'Pending approval'), confirmed: L('تمت الموافقة', 'Approved'),
    shipped: L('تم الشحن', 'Shipped'), delivered: L('تم التسليم', 'Delivered'),
    cancelled: L('مرفوض / ملغي', 'Rejected / Cancelled'), returned: L('مرتجع', 'Returned'),
  })[status] || status;
  const paymentLabel = method => ({
    fawry: L('فوري', 'Fawry'), instapay: 'InstaPay', cod: L('الدفع عند الاستلام', 'Cash on delivery'),
  })[method] || method;

  return (
    <section className="wrap section admin-page">
      <header className="admin-head">
        <div><p className="account-kicker">{L('مرحبًا،', 'Welcome,')} {user.first_name}</p><h1>{L('لوحة تحكم لافينا', 'Lavina Admin Dashboard')}</h1></div>
        <button className="btn line" onClick={loadData}>{L('تحديث البيانات', 'Refresh')}</button>
      </header>
      <nav className="admin-tabs" aria-label={L('أقسام لوحة الإدارة', 'Admin sections')}>
        {tabs.map(([key, title, count]) => <button key={key} className={section === key ? 'on' : ''} onClick={() => setSection(key)}>{title}<span>{count}</span></button>)}
      </nav>
      {message && <p className="admin-success" role="status">{message}</p>}
      {error && <p className="error admin-error" role="alert">{error}</p>}

      {section === 'orders' && <section className="admin-content">
        <h2>{L('طلبات العملاء', 'Customer orders')}</h2>
        {!orders.length && <p className="empty">{L('لا توجد طلبات حتى الآن.', 'No orders yet.')}</p>}
        <div className="admin-cards">{visibleItems(orders, 'orders').map(order => <article className="admin-card" key={order.id}>
          <div className="admin-card-head"><strong>#{order.id}</strong><span className={`status status-${order.status}`}>{statusLabel(order.status)}</span></div>
          <p>{order.first_name} {order.last_name} · {order.email}</p>
          <button className="btn line order-details-toggle" aria-expanded={expandedOrder === order.id}
            onClick={() => setExpandedOrder(current => current === order.id ? null : order.id)}>
            {expandedOrder === order.id ? L('إخفاء التفاصيل', 'Hide details') : L('عرض تفاصيل الطلب', 'View order details')}
          </button>
          {expandedOrder === order.id && <div className="order-details">
            <h3>{L('بيانات العميل والتوصيل', 'Customer & delivery')}</h3>
            <dl className="order-detail-grid">
              <dt>{L('الاسم', 'Name')}</dt><dd>{order.first_name} {order.last_name}</dd>
              <dt>{L('البريد الإلكتروني', 'Email')}</dt><dd>{order.email}</dd>
              <dt>{L('هاتف التوصيل', 'Delivery phone')}</dt><dd dir="ltr">{order.ship_phone}</dd>
              <dt>{L('العنوان', 'Address')}</dt><dd>{[order.ship_governorate, order.ship_city, order.ship_street].filter(Boolean).join('، ') || L('غير متوفر', 'Not provided')}</dd>
              <dt>{L('طريقة الدفع', 'Payment method')}</dt><dd>{paymentLabel(order.payment_method)}</dd>
              <dt>{L('تاريخ الطلب', 'Order date')}</dt><dd>{new Date(`${order.created_at.replace(' ', 'T')}Z`).toLocaleString(en ? 'en-US' : 'ar-EG')}</dd>
            </dl>
            <h3>{L('المنتجات', 'Items')}</h3>
            <ul className="admin-order-items order-detail-items">{order.items.map(item => (
              <li key={item.id}>
                {item.images?.[0] && <img src={item.images[0]} alt="" />}
                <div className="order-detail-product">
                  <strong>{item.name}</strong>
                  <small>{item.sku && `${L('كود المنتج', 'SKU')}: ${item.sku}`}{item.karat && ` · ${item.karat} ${L('قيراط', 'Karat')}`}{item.weight_g != null && ` · ${item.weight_g} ${L('جرام', 'g')}`}</small>
                  <span>{L('سعر القطعة', 'Unit price')}: {Number(item.unit_price).toLocaleString()} EGP × {item.quantity}</span>
                </div>
                <b>{Number(item.unit_price * item.quantity).toLocaleString()} EGP</b>
              </li>
            ))}</ul>
            <dl className="order-price-details">
              <dt>{L('الإجمالي الفرعي', 'Subtotal')}</dt><dd>{Number(order.subtotal).toLocaleString()} EGP</dd>
              <dt>{L('الشحن', 'Shipping')}</dt><dd>{Number(order.shipping).toLocaleString()} EGP</dd>
              <dt><strong>{L('الإجمالي النهائي', 'Grand total')}</strong></dt><dd><strong>{Number(order.total).toLocaleString()} EGP</strong></dd>
            </dl>
          </div>}
          <div className="admin-card-foot"><strong>{L('الإجمالي', 'Total')}: {Number(order.total).toLocaleString()} EGP</strong>
            {order.status === 'pending' ? <div className="admin-actions">
              <button className="btn dark" disabled={busy} onClick={() => saveOrderStatus(order.id, 'confirmed')}>{L('الموافقة على الطلب', 'Approve order')}</button>
              <button className="admin-danger" disabled={busy} onClick={() => {
                if (window.confirm(L('هل تريد رفض هذا الطلب؟', 'Reject this order?'))) saveOrderStatus(order.id, 'cancelled');
              }}>{L('رفض الطلب', 'Reject order')}</button>
            </div> : order.status !== 'cancelled' && <select aria-label={L('تحديث حالة الطلب', 'Update order status')} disabled={busy} value={order.status} onChange={event => saveOrderStatus(order.id, event.target.value)}>
              {['pending', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled'].map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}
            </select>}
          </div>
        </article>)}</div>
        {moreItems(orders, 'orders')}
      </section>}

      {section === 'products' && <section className="admin-content">
        <h2>{editingProduct ? L('تعديل المنتج', 'Edit product') : L('إضافة منتج جديد', 'Add a product')}</h2>
        <form className="admin-form" onSubmit={submitProduct}>
          <div className="admin-form-grid">
            <label>{L('كود المنتج SKU', 'SKU')}<input required value={product.sku} onChange={e => setProductField('sku', e.target.value)} /></label>
            <label>{L('اسم المنتج بالعربية', 'Arabic product name')}<input required value={product.name} onChange={e => setProductField('name', e.target.value)} /></label>
            <label>{L('الاسم بالإنجليزية', 'English name')}<input value={product.name_en} onChange={e => setProductField('name_en', e.target.value)} /></label>
            <label>{L('التصنيف', 'Category')}<select required value={product.category_id} onChange={e => setProductField('category_id', e.target.value)}><option value="">{L('اختر التصنيف', 'Choose category')}</option>{categories.map(c => <option key={c.id} value={c.id}>{en ? c.name_en : c.name_ar}</option>)}</select></label>
            <label>{L('نوع القطعة', 'Item type')}<select value={product.item_type} onChange={e => setProductField('item_type', e.target.value)}>{[['ring','خاتم','Ring'],['necklace','سلسلة','Necklace'],['bracelet','إسورة','Bracelet'],['earring','أقراط','Earrings'],['set','طقم','Set'],['other','أخرى','Other']].map(([value,ar,english])=><option key={value} value={value}>{L(ar,english)}</option>)}</select></label>
            <label>{L('السعر بالجنيه', 'Price (EGP)')}<input required type="number" min="0.01" step="0.01" value={product.price} onChange={e => setProductField('price', e.target.value)} /></label>
            <label>{L('الخصم %', 'Discount %')}<input type="number" min="0" max="90" value={product.discount_percent} onChange={e => setProductField('discount_percent', e.target.value)} /></label>
            <label>{L('المخزون', 'Stock')}<input type="number" min="0" value={product.stock} onChange={e => setProductField('stock', e.target.value)} /></label>
            <label>{L('العيار', 'Karat')}<input type="number" min="1" value={product.karat} onChange={e => setProductField('karat', e.target.value)} /></label>
            <label>{L('الوزن بالجرام', 'Weight (g)')}<input type="number" min="0" step="0.01" value={product.weight_g} onChange={e => setProductField('weight_g', e.target.value)} /></label>
          </div>
          <label>{L('الوصف التفصيلي', 'Description')}<textarea required rows="4" value={product.description} onChange={e => setProductField('description', e.target.value)} /></label>
          <label>{L('صور المنتج', 'Product images')}<input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy} onChange={e => { uploadImages([...e.target.files], uploaded => setProduct(current => ({ ...current, images: [...current.images, ...uploaded] }))); e.target.value = ''; }} /></label>
          <div className="admin-image-list">{product.images.map(image => <div key={image}><img src={image} alt="" /><button type="button" onClick={() => setProductField('images', product.images.filter(src => src !== image))}>{L('إزالة', 'Remove')}</button></div>)}</div>
          <div className="admin-checks">
            <label><input type="checkbox" checked={product.is_best_seller} onChange={e => setProductField('is_best_seller', e.target.checked)} />{L('الأكثر مبيعًا', 'Best seller')}</label>
            <label><input type="checkbox" checked={product.is_new} onChange={e => setProductField('is_new', e.target.checked)} />{L('وصل حديثًا', 'New arrival')}</label>
            {editingProduct && <label><input type="checkbox" checked={product.is_active} onChange={e => setProductField('is_active', e.target.checked)} />{L('ظاهر في المتجر', 'Visible in store')}</label>}
          </div>
          <div className="admin-actions"><button className="btn dark" disabled={busy}>{busy ? L('جارٍ الحفظ…', 'Saving…') : L('حفظ المنتج', 'Save product')}</button>
            {editingProduct && <button type="button" className="btn line" onClick={() => { setProduct(emptyProduct()); setEditingProduct(null); }}>{L('إلغاء التعديل', 'Cancel edit')}</button>}
          </div>
        </form>
        <h2 className="admin-subhead">{L('المنتجات الحالية', 'Current products')}</h2>
        <div className="admin-list">{visibleItems(products, 'products').map(item => <article key={item.id}><img src={item.images[0]} alt="" /><div><b>{item.name}</b><small>{item.sku} · {Number(item.price).toLocaleString()} EGP · {item.stock} {L('متاح', 'in stock')}</small>{!item.is_active && <em>{L('مخفي', 'Hidden')}</em>}</div><button className="btn line" onClick={() => editProduct(item)}>{L('تعديل', 'Edit')}</button><button className="admin-danger" onClick={() => deleteProduct(item)}>{L('إخفاء', 'Hide')}</button></article>)}</div>
        {moreItems(products, 'products')}
      </section>}

      {section === 'reviews' && <section className="admin-content">
        <h2>{L('إدارة تقييمات العملاء', 'Manage customer reviews')}</h2>
        {!reviews.length && <p className="empty">{L('لا توجد تقييمات.', 'No reviews yet.')}</p>}
        <div className="admin-cards">{visibleItems(reviews, 'reviews').map(review => <article className="admin-card" key={review.id}>
          <div className="admin-card-head"><strong>{review.product_name}</strong><span className={`status ${review.is_approved ? 'status-confirmed' : 'status-pending'}`}>{review.is_approved ? L('منشور', 'Published') : L('مخفي', 'Hidden')}</span></div>
          <p>{review.first_name} {review.last_name} · {review.sku}</p>
          <p className="admin-review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
          <p>{review.comment || L('بدون تعليق', 'No comment')}</p>
          <div className="admin-actions"><button className="btn line" disabled={busy} onClick={() => updateReview(review, !review.is_approved)}>{review.is_approved ? L('إخفاء التقييم', 'Hide review') : L('نشر التقييم', 'Publish review')}</button><button className="admin-danger" disabled={busy} onClick={() => deleteReview(review)}>{L('حذف نهائي', 'Delete permanently')}</button></div>
        </article>)}</div>
        {moreItems(reviews, 'reviews')}
      </section>}

      {section === 'stores' && <section className="admin-content">
        <h2>{editingStore ? L('تعديل بيانات الفرع', 'Edit store') : L('إضافة فرع ومواعيد العمل', 'Add a store and opening hours')}</h2>
        <form className="admin-form" onSubmit={submitStore}>
          <div className="admin-form-grid">
            <label>{L('اسم الفرع', 'Store name')}<input required value={store.name} onChange={e => setStoreField('name', e.target.value)} /></label>
            <label>{L('رقم الهاتف', 'Phone')}<input value={store.phone} onChange={e => setStoreField('phone', e.target.value)} /></label>
            <label>{L('العنوان', 'Address')}<input required value={store.address} onChange={e => setStoreField('address', e.target.value)} /></label>
            <label>{L('رابط الموقع على الخريطة', 'Map location URL')}<input type="url" value={store.location_url} onChange={e => setStoreField('location_url', e.target.value)} placeholder="https://maps.google.com/…" /></label>
          </div>
          <fieldset className="admin-hours"><legend>{L('مواعيد العمل (مثال: 10:00 - 22:00، اتركه فارغًا للإغلاق)', 'Opening hours (e.g. 10:00 - 22:00; leave blank when closed)')}</legend>
            {DAYS.map(([key, ar, english]) => <label key={key}>{L(ar, english)}<input value={store.opening_hours[key] || ''} onChange={e => setStoreField('opening_hours', { ...store.opening_hours, [key]: e.target.value })} /></label>)}
          </fieldset>
          <label>{L('صور الفرع', 'Store photos')}<input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy} onChange={e => { uploadImages([...e.target.files], uploaded => setStore(current => ({ ...current, images: [...current.images, ...uploaded] }))); e.target.value = ''; }} /></label>
          <div className="admin-image-list">{store.images.map(image => <div key={image}><img src={image} alt="" /><button type="button" onClick={() => setStoreField('images', store.images.filter(src => src !== image))}>{L('إزالة', 'Remove')}</button></div>)}</div>
          <div className="admin-actions"><button className="btn dark" disabled={busy}>{L('حفظ بيانات الفرع', 'Save store details')}</button>{editingStore && <button type="button" className="btn line" onClick={() => { setStore(emptyStore()); setEditingStore(null); }}>{L('إلغاء التعديل', 'Cancel edit')}</button>}</div>
        </form>
        <h2 className="admin-subhead">{L('الفروع الظاهرة للزوار', 'Stores visible to customers')}</h2>
        <div className="admin-list">{visibleItems(stores, 'stores').map(item => <article key={item.id}>{item.images[0] && <img src={item.images[0]} alt="" />}<div><b>{item.name}</b><small>{item.address} · {item.phone}</small></div><button className="btn line" onClick={() => editStore(item)}>{L('تعديل', 'Edit')}</button><button className="admin-danger" onClick={() => deleteStore(item)}>{L('حذف', 'Delete')}</button></article>)}</div>
        {moreItems(stores, 'stores')}
      </section>}
    </section>
  );
}
