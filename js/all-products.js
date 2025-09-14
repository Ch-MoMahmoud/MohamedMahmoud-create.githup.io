(async function(){
  const grid = document.getElementById('allGrid');
  const pager = document.getElementById('allPager');
  const catList = document.getElementById('catList');
  const priceMin = document.getElementById('priceMin');
  const priceMax = document.getElementById('priceMax');
  const priceMinLabel = document.getElementById('priceMinLabel');
  const priceMaxLabel = document.getElementById('priceMaxLabel');
  const applyBtn = document.getElementById('applyFilters');
  const filterToggle = document.getElementById('filterToggle');
  const shopSidebar = document.getElementById('shopSidebar');
  if(!grid) return;

  const el = (tag, cls) => { const e = document.createElement(tag); if(cls) e.className = cls; return e; };
  const getInlineData = () => {
    const script = document.getElementById('productsData');
    if(!script) return null;
    try{ return JSON.parse(script.textContent || '{}'); } catch(e){ return null; }
  };

  let data = null;
  try{
    if(location.protocol === 'file:') throw new Error('file-protocol');
    const res = await fetch('data/products.json', {cache:'no-store'});
    if(!res.ok) throw new Error('تعذر تحميل ملف المنتجات');
    data = await res.json();
  }catch{
    data = getInlineData();
  }

  try{
    if(!data) throw new Error('no-data');
    const currency = data.currency || 'EGP';
    const products = (data.products || []).filter(p=> p.status !== 'inactive');

    // Setup price bounds
    const prices = products.map(p=> Number(p.price)||0);
    const minBound = Math.min(...prices, 0);
    const maxBound = Math.max(...prices, 0, Number(priceMax ? priceMax.max : 500));
    if(priceMin){ priceMin.min = String(minBound); priceMin.max = String(maxBound); priceMin.value = String(minBound); }
    if(priceMax){ priceMax.min = String(minBound); priceMax.max = String(maxBound); priceMax.value = String(maxBound); }
    if(priceMinLabel) priceMinLabel.textContent = String(minBound);
    if(priceMaxLabel) priceMaxLabel.textContent = String(maxBound);

    // Categories map
    const catName = (id)=> (data.categories||[]).find(c=> c.id===id)?.name || id;
    const cats = ['all', ...Array.from(new Set(products.map(p=> p.categoryId)))];
    let selectedCat = 'all';

    const priceFmt = (value)=> `${value} ج.م`;
    const perPage = 6;

    const buildCatList = (visibleItems)=>{
      if(!catList) return;
      catList.innerHTML = '';
      cats.forEach(cid=>{
        const li = document.createElement('li');
        const name = cid==='all' ? 'الكل' : catName(cid);
        const count = visibleItems.filter(p=> cid==='all' ? true : p.categoryId===cid).length;
        li.innerHTML = `<span>${name}</span><span class="count">${count}</span>`;
        if((cid==='all' && selectedCat==='all') || (cid===selectedCat)) li.setAttribute('aria-current','true');
        li.addEventListener('click', ()=>{ selectedCat = cid; render(1); });
        catList.appendChild(li);
      });
    };

    const applyFilters = (items)=>{
      const minV = priceMin ? Number(priceMin.value) : minBound;
      const maxV = priceMax ? Number(priceMax.value) : maxBound;
      const byPrice = items.filter(p=> (Number(p.price)||0) >= minV && (Number(p.price)||0) <= maxV);
      const byCat = selectedCat==='all' ? byPrice : byPrice.filter(p=> p.categoryId === selectedCat);
      return byCat;
    };

    const renderCards = (items)=>{
      grid.innerHTML = '';
      items.forEach((p, idx)=>{
        const card = el('article','product-card reveal');
        card.setAttribute('data-animate','fade-up');
        card.setAttribute('data-delay', String(140 + idx*60));

        const a = el('a','product-media');
        a.href = '#'; a.setAttribute('aria-label', p.title);
        const img = el('img');
        img.src = p.thumbnail || (p.images && p.images[0]) || 'imgs/honey.jpeg';
        img.alt = p.title; img.loading = 'lazy';
        a.appendChild(img);

        if(p.discount && p.discount.type === 'percentage' && typeof p.discount.value === 'number'){
          const sale = el('span','product-badge product-badge--sale'); sale.textContent = `${p.discount.value}%`; a.appendChild(sale);
        } else if(p.featured){
          const badge = el('span','product-badge product-badge--new'); badge.textContent = 'جديد'; a.appendChild(badge);
        }

        const content = el('div','product-content');
        const title = el('h3','product-title'); title.textContent = p.title;
        const priceWrap = el('div','product-price');
        const current = el('span','product-price__current'); current.textContent = priceFmt(p.price); priceWrap.appendChild(current);
        if(p.compareAtPrice && p.compareAtPrice > p.price){ const old = el('span','product-price__old'); old.textContent = priceFmt(p.compareAtPrice); priceWrap.appendChild(old); }
        const btn = el('button','btn btn--add'); btn.type='button'; btn.innerHTML='أضف إلى السلة <i class="fa-solid fa-cart-shopping"></i>';

        content.appendChild(title); content.appendChild(priceWrap); content.appendChild(btn);
        card.appendChild(a); card.appendChild(content);
        grid.appendChild(card);
      });

      if(window && 'IntersectionObserver' in window){
        const toObserve = grid.querySelectorAll('.reveal');
        const io = new IntersectionObserver((entries)=>{
          entries.forEach((entry)=>{ if(entry.isIntersecting){ const elx = entry.target; const delay = parseInt(elx.getAttribute('data-delay')||'0', 10); elx.classList.add('reveal'); setTimeout(()=> elx.classList.add('in-view'), delay); io.unobserve(elx); } });
        },{ threshold: .15, rootMargin: '0px 0px -10%' });
        toObserve.forEach(elm=> io.observe(elm));
      }
    };

    const buildPager = (page, totalPages, onGo)=>{
      if(!pager) return;
      pager.innerHTML='';
      if(totalPages <= 1) return;
      const mk = (label, p, current=false)=>{ const b = document.createElement('button'); b.textContent = label; if(current) b.setAttribute('aria-current','page'); b.addEventListener('click', ()=> onGo(p)); return b; };
      pager.appendChild(mk('‹', Math.max(1, page-1)));
      for(let i=1;i<=totalPages;i++) pager.appendChild(mk(String(i), i, i===page));
      pager.appendChild(mk('›', Math.min(totalPages, page+1)));
    };

    const render = (page=1)=>{
      // Update labels while rendering
      if(priceMinLabel && priceMin) priceMinLabel.textContent = String(priceMin.value);
      if(priceMaxLabel && priceMax) priceMaxLabel.textContent = String(priceMax.value);

      const filtered = applyFilters(products);
      buildCatList(filtered);

      const per = perPage;
      const pages = Math.ceil(filtered.length / per) || 1;
      const start = (page-1)*per;
      renderCards(filtered.slice(start, start+per));
      buildPager(page, pages, (p)=> render(p));
    };

    // Initial
    render(1);

    // Wire controls
    if(priceMin) priceMin.addEventListener('input', ()=>{ if(priceMinLabel) priceMinLabel.textContent = String(priceMin.value); });
    if(priceMax) priceMax.addEventListener('input', ()=>{ if(priceMaxLabel) priceMaxLabel.textContent = String(priceMax.value); });
    if(applyBtn) applyBtn.addEventListener('click', ()=> render(1));

    // Mobile filter toggle behavior
    const BREAKPOINT = 981;
    const applyLayout = ()=>{
      const w = window.innerWidth || document.documentElement.clientWidth;
      if(!shopSidebar) return;
      if(w < BREAKPOINT){
        // mobile: keep hidden by default, show toggle
        if(filterToggle) filterToggle.style.display = 'inline-flex';
        shopSidebar.setAttribute('hidden','');
        if(filterToggle) filterToggle.setAttribute('aria-expanded','false');
      }else{
        // desktop: show sidebar and hide toggle
        shopSidebar.removeAttribute('hidden');
        if(filterToggle) filterToggle.style.display = 'none';
      }
    };
    applyLayout();
    window.addEventListener('resize', applyLayout, {passive:true});

    if(filterToggle && shopSidebar){
      filterToggle.addEventListener('click', ()=>{
        const isHidden = shopSidebar.hasAttribute('hidden');
        if(isHidden) shopSidebar.removeAttribute('hidden'); else shopSidebar.setAttribute('hidden','');
        filterToggle.setAttribute('aria-expanded', String(isHidden));
      });
    }

  }catch(err){
    const p = el('p','section-subtitle'); p.textContent = 'حدث خطأ أثناء تحميل جميع المنتجات.'; grid.appendChild(p); console.error(err);
  }
})();
