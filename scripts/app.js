
const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('ae_cart')||'[]'),
  wishlist: JSON.parse(localStorage.getItem('ae_wishlist')||'[]'),
  testimonials: JSON.parse(localStorage.getItem('ae_testimonials')||'[]')
};
document.addEventListener('DOMContentLoaded', init);
async function init(){
  const theme = localStorage.getItem('ae_theme') || 'dark';
  if (theme === 'light') document.documentElement.setAttribute('data-theme','light');
  const tt = document.getElementById('theme-toggle'); if (tt) tt.addEventListener('click', ()=>{
    const isLight = document.documentElement.getAttribute('data-theme')==='light';
    document.documentElement.setAttribute('data-theme', isLight?'':'light');
    localStorage.setItem('ae_theme', isLight?'dark':'light');
  });
  updateCartCount();
  try{ const res = await fetch('data/products.json'); state.products = await res.json(); }catch(e){ console.error(e); }
  const page = location.pathname.split('/').pop() || 'index.html';
  if (page==='index.html' || page==='') renderHome();
  if (page==='products.html') renderProducts();
  if (page==='product.html') renderProductDetail();
  if (page==='contact.html') setupContact();
  if (page==='cart.html') renderCart();
  if (page==='testimonials.html') renderTestimonials();
  if (page==='gallery.html') renderGallery();
}
function money(n){ return new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(n); }
function updateCartCount(){ const el=document.getElementById('cart-count'); if(el){ const c=state.cart.reduce((s,i)=>s+i.qty,0); el.textContent=`Cart (${c})`; } }
function renderHome(){
  const g=document.getElementById('featured-grid'); if(g){ g.innerHTML=state.products.slice(0,8).map(p=>ProductCard(p,true)).join(''); }
  const k=document.getElementById('kpi-products'); if(k) k.textContent = state.products.length + '+';
  const hg=document.getElementById('home-gallery'); if(hg){ const pics=state.products.flatMap(p=> (p.images||[]).slice(0,2)).slice(0,10); hg.innerHTML=pics.map(src=>`<img src="${src}" onclick="openLightbox('${src}')" alt="gallery">`).join(''); }
}
function renderGallery(){
  const grid=document.getElementById('gallery-grid'); if(!grid) return;
  const pics=state.products.flatMap(p=> (p.images||[])).slice(0,30);
  grid.innerHTML = pics.map(src=>`<img src="${src}" onclick="openLightbox('${src}')" alt="gallery">`).join('');
}
function openLightbox(src){ const lb=document.getElementById('lightbox'); lb.style.display='flex'; lb.querySelector('img').src=src; }
function closeLightbox(){ document.getElementById('lightbox').style.display='none'; }
function renderProducts(){
  const grid=document.getElementById('products-grid');
  const search=document.getElementById('search');
  const category=document.getElementById('category');
  const sort=document.getElementById('sort');
  const wishlistOnly=document.getElementById('wishlistOnly');
  const cats=[...new Set(state.products.map(p=>p.category))];
  category.innerHTML='<option value=\"\">All</option>'+cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  function apply(){
    let items=[...state.products];
    const q=(search.value||'').toLowerCase(); const cat=category.value;
    if(q) items=items.filter(p=>p.name.toLowerCase().includes(q)||p.description.toLowerCase().includes(q));
    if(cat) items=items.filter(p=>p.category===cat);
    switch(sort.value){case'price-asc':items.sort((a,b)=>a.price-b.price);break;case'price-desc':items.sort((a,b)=>b.price-a.price);break;case'newest':items.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));break;default:items.sort((a,b)=>b.rating-a.rating);}
    if(wishlistOnly.checked) items=items.filter(p=>state.wishlist.includes(p.id));
    grid.innerHTML=items.map(p=>ProductCard(p,true)).join('');
  }
  ['input','change'].forEach(ev=>search.addEventListener(ev, apply));
  category.addEventListener('change', apply); sort.addEventListener('change', apply); wishlistOnly.addEventListener('change', apply);
  apply();
}
function openQuickView(id){
  const m=document.getElementById('quickview'); const body=document.getElementById('qv-body'); const title=document.getElementById('qv-title');
  const p=state.products.find(x=>x.id===id); if(!p) return; title.textContent=p.name;
  const imgs=(p.images&&p.images.length?p.images:[p.image]).slice(0,3);
  body.innerHTML=`<div class="card"><img class="thumb" src="${imgs[0]}" alt="${p.name}"/></div>
  <div class="card p"><div class="badge">${p.category}</div><h3>${p.name}</h3><div class="price">${money(p.price)}</div>
  <p style="color:#9aa4be">${p.description}</p>
  <div class="menu"><button class="btn" onclick="addToCart('${p.id}',1)">Add to cart</button>
  <button class="btn btn-secondary" onclick="toggleWishlist('${p.id}')">${state.wishlist.includes(p.id)?'♥ In Wishlist':'♡ Wishlist'}</button>
  <a class="btn btn-secondary" href="product.html?id=${p.id}">View details</a></div></div>`;
  m.style.display='grid';
}
function closeQuickView(){ document.getElementById('quickview').style.display='none'; }
function renderProductDetail(){
  const root=document.getElementById('product-detail'); if(!root) return;
  const id=new URL(location.href).searchParams.get('id'); const p=state.products.find(x=>x.id===id)||state.products[0]; if(!p){ root.innerHTML='<div class="badge">Product not found.</div>'; return; }
  const imgs=(p.images&&p.images.length?p.images:[p.image]).slice(0,10);
  root.innerHTML=`<div class="card p">
    <img class="thumb" id="main-img" src="${imgs[0]}" alt="${p.name}"/>
    <div class="grid" style="grid-template-columns:repeat(5,1fr); gap:.5rem; margin-top:.5rem">
      ${imgs.map((src,i)=>`<img src="${src}" alt="thumb ${i}" style="aspect-ratio:1/1;border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,.1)" onclick="document.getElementById('main-img').src='${src}'"/>`).join('')}
    </div></div>
    <div class="card p"><span class="badge">${p.category}</span><h2>${p.name}</h2>
      <div style="display:flex;gap:.5rem;align-items:center"><div class="price">${money(p.price)}</div><div class="badge">★ ${p.rating}</div></div>
      <p style="color:#9aa4be">${p.description}</p>
      <div class="menu">
        <div class="qty"><button onclick="stepQty(-1)">−</button><input id="pd-qty" value="1"/><button onclick="stepQty(1)">+</button></div>
        <button class="btn" onclick="addToCart('${p.id}', parseInt(document.getElementById('pd-qty').value||'1',10))">Add to cart</button>
        <button class="btn btn-secondary" onclick="toggleWishlist('${p.id}')">${state.wishlist.includes(p.id)?'♥ In Wishlist':'♡ Wishlist'}</button>
      </div></div>`;
  const form=document.getElementById('review-form');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name=document.getElementById('rv-name').value.trim();
    const rating=parseInt(document.getElementById('rv-rating').value,10);
    const text=document.getElementById('rv-text').value.trim();
    if(!name||!rating||!text) return;
    const key='ae_reviews_'+p.id;
    const arr=JSON.parse(localStorage.getItem(key)||'[]'); arr.unshift({name,rating,text,at:new Date().toISOString()});
    localStorage.setItem(key, JSON.stringify(arr));
    document.getElementById('rv-name').value=''; document.getElementById('rv-rating').value=''; document.getElementById('rv-text').value='';
    loadReviews(p.id);
  });
  loadReviews(p.id);
}
function loadReviews(id){
  const box=document.getElementById('reviews'); const key='ae_reviews_'+id;
  const arr=JSON.parse(localStorage.getItem(key)||'[]');
  if(!arr.length){ box.innerHTML='<div class="badge">Be the first to review this product.</div>'; return; }
  box.innerHTML=arr.map(r=>`<div class="card p"><strong>${r.name}</strong> — ${'★'.repeat(r.rating)}<p style="color:#9aa4be">${r.text}</p></div>`).join('');
}
function stepQty(d){ const el=document.getElementById('pd-qty'); let v=parseInt(el.value||'1',10)+d; if(v<1) v=1; el.value=v; }
function toggleWishlist(id){ const i=state.wishlist.indexOf(id); if(i>=0) state.wishlist.splice(i,1); else state.wishlist.push(id); localStorage.setItem('ae_wishlist', JSON.stringify(state.wishlist)); if(location.pathname.endsWith('products.html')) renderProducts(); if(location.pathname.endsWith('product.html')) renderProductDetail(); }
function setupContact(){ window.sendMessage=(e)=>{ e.preventDefault(); const n=document.getElementById('name').value.trim(); const em=document.getElementById('email').value.trim(); const m=document.getElementById('message').value.trim(); const box=document.getElementById('contact-status'); if(!n||!em||!m) return; localStorage.setItem('ae_last_message', JSON.stringify({n,em,m,at:new Date().toISOString()})); box.style.display='block'; box.textContent='Thanks, '+n+' — message received.'; }; }
function renderCart(){
  const tbody=document.querySelector('#cart-table tbody'); const empty=document.getElementById('cart-empty'); const table=document.getElementById('cart-table'); const summary=document.getElementById('cart-summary');
  if(state.cart.length===0){ empty.style.display='block'; table.style.display='none'; summary.style.display='none'; return; }
  empty.style.display='none'; table.style.display=''; summary.style.display='';
  tbody.innerHTML=state.cart.map(item=>{ const p=state.products.find(x=>x.id===item.id)||{name:'Item',price:0,image:''}; const total=p.price*item.qty; return `<tr>
    <td><div style="display:flex;gap:.75rem;align-items:center"><img src="${p.image}" style="width:60px;height:60px;object-fit:cover;border-radius:10px"/><div><strong>${p.name}</strong><div class="badge">${p.category||''}</div></div></div></td>
    <td>${money(p.price)}</td>
    <td><div class="qty"><button onclick="changeQty('${item.id}',-1)">−</button><input value="${item.qty}" readonly/><button onclick="changeQty('${item.id}',1)">+</button></div></td>
    <td>${money(total)}</td>
    <td><button class="btn btn-secondary" onclick="removeFromCart('${item.id}')">Remove</button></td></tr>`; }).join('');
  document.getElementById('cart-subtotal').textContent=money(state.cart.reduce((s,i)=>{const p=state.products.find(x=>x.id===i.id)||{price:0}; return s+p.price*i.qty;},0));
}
function changeQty(id,d){ const it=state.cart.find(i=>i.id===id); if(!it) return; it.qty+=d; if(it.qty<=0) state.cart=state.cart.filter(i=>i.id!==id); persistCart(); renderCart(); }
function removeFromCart(id){ state.cart=state.cart.filter(i=>i.id!==id); persistCart(); renderCart(); }
function addToCart(id,qty=1){ const found=state.cart.find(i=>i.id===id); if(found) found.qty+=qty; else state.cart.push({id,qty}); persistCart(); updateCartCount(); alert('Added to cart!'); }
function persistCart(){ localStorage.setItem('ae_cart', JSON.stringify(state.cart)); updateCartCount(); }
function checkout(){ const order={items:state.cart,total:state.cart.reduce((s,i)=>{const p=state.products.find(x=>x.id===i.id)||{price:0}; return s+p.price*i.qty;},0),at:new Date().toISOString()}; localStorage.setItem('ae_last_order', JSON.stringify(order)); alert('Checkout simulated.'); state.cart=[]; persistCart(); location.href='products.html'; }
function renderTestimonials(){ const box=document.getElementById('testimonials'); const form=document.getElementById('t-form'); function draw(){ if(!state.testimonials.length){ box.innerHTML='<div class="badge">No testimonials yet — be the first!</div>'; return; } box.innerHTML=state.testimonials.map(t=>`<div class="card p"><strong>${t.name}</strong><p style="color:#9aa4be">${t.text}</p></div>`).join(''); } draw(); form.addEventListener('submit', (e)=>{ e.preventDefault(); const name=document.getElementById('t-name').value.trim(); const text=document.getElementById('t-text').value.trim(); if(!name||!text) return; state.testimonials.unshift({name,text,at:new Date().toISOString()}); localStorage.setItem('ae_testimonials', JSON.stringify(state.testimonials)); document.getElementById('t-name').value=''; document.getElementById('t-text').value=''; draw(); }); }
function ProductCard(p){ return `<div class="card"><a href="product.html?id=${p.id}"><img class="thumb" src="${p.image}" alt="${p.name}"/></a><div class="p"><div><strong>${p.name}</strong></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:.35rem"><div class="badge">${money(p.price)}</div><div class="menu"><button class="icon-btn" onclick="openQuickView('${p.id}')">👁️</button><button class="icon-btn" onclick="toggleWishlist('${p.id}')">${(JSON.parse(localStorage.getItem('ae_wishlist')||'[]')).includes(p.id)?'♥':'♡'}</button><button class="btn btn-secondary" onclick="addToCart('${p.id}',1)">Add</button></div></div><div class="menu" style="gap:.5rem;margin-top:.5rem"><span class="badge">${p.category}</span><span class="badge">★ ${p.rating}</span></div></div></div>`; }
