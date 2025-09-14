// Reveal on scroll using IntersectionObserver
(function(){
  // 1) Auto-assign animations + delays for breadcrumb items (stagger)
  const crumbs = document.querySelectorAll('.nav-center .breadcrumb li');
  crumbs.forEach((li, i)=>{
    if(!li.hasAttribute('data-animate')) li.setAttribute('data-animate','fade-up');
    li.setAttribute('data-delay', String(80 * i));
  });

  // 2) Observe any .reveal or [data-animate] elements
  const items = new Set([
    ...document.querySelectorAll('.reveal'),
    ...document.querySelectorAll('[data-animate]')
  ]);

  const io = new IntersectionObserver((entries)=>{
    entries.forEach((entry)=>{
      if(entry.isIntersecting){
        const el = entry.target;
        const delay = parseInt(el.getAttribute('data-delay')||'0', 10);
        // ensure base hidden state if element didn't have .reveal
        el.classList.add('reveal');
        setTimeout(()=>{
          el.classList.add('in-view');
        }, delay);
        io.unobserve(el);
      }
    })
  },{ threshold: .15, rootMargin: '0px 0px -10%' });

  items.forEach(el=> io.observe(el));
})();

// Off-canvas menu for small screens
(function(){
  const body = document.body;
  const menu = document.getElementById('sideMenu');
  const toggle = document.querySelector('.menu-toggle');
  if(!menu || !toggle) return;
  const panel = menu.querySelector('.side-menu__panel');
  const backdrop = menu.querySelector('.side-menu__backdrop');
  const closeBtn = menu.querySelector('.side-menu__close');

  const open = ()=>{
    body.classList.add('menu-open');
    toggle.setAttribute('aria-expanded','true');
    menu.setAttribute('aria-hidden','false');
    // focus within panel for accessibility
    (closeBtn || panel).focus({preventScroll:true});
  };
  const close = ()=>{
    body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-hidden','true');
    toggle.focus({preventScroll:true});
  };

  toggle.addEventListener('click', ()=>{
    if(body.classList.contains('menu-open')) close(); else open();
  });
  closeBtn && closeBtn.addEventListener('click', close);
  backdrop && backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });
})();

// Parallax: subtle scale and translate for hero image
(function(){
  const img = document.getElementById('heroImg');
  if(!img) return;
  let y = 0;
  const onScroll = ()=>{
    const t = window.scrollY || document.documentElement.scrollTop;
    y = Math.min(20, t/10);
    img.style.transform = `translateY(${y}px) scale(1.04)`;
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();

// Button interactive glow following mouse
(function(){
  const btns = document.querySelectorAll('.btn--primary');
  btns.forEach(btn=>{
    btn.addEventListener('pointermove', (e)=>{
      const rect = btn.getBoundingClientRect();
      const mx = e.clientX - rect.left; // within button
      const my = e.clientY - rect.top;
      btn.style.setProperty('--mx', `${mx}px`);
      btn.style.setProperty('--my', `${my}px`);
    });
  })
})();

// Cart micro-interaction: quick wiggle when clicked
(function(){
  const cart = document.querySelector('.cart');
  if(!cart) return;
  cart.addEventListener('click', ()=>{
    cart.animate([
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(8deg)' },
      { transform: 'rotate(-6deg)' },
      { transform: 'rotate(4deg)' },
      { transform: 'rotate(0deg)' }
    ], { duration: 450, easing: 'ease-in-out' });
  });
})();
