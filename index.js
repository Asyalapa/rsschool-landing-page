/* ==========================================================================
   КОНСТАНТЫ И ДАННЫЕ
   ========================================================================== */
const STORAGE_KEY = 'theme';
const INITIAL_VISIBLE = 4;

const HOME_SLIDES = [
  {
    title: 'S’mores Frappuccino',
    description:
      'This new drink takes an espresso and mixes it with brown sugar and cinnamon before being topped with oat milk.',
    price: 5.5,
    image: 'images/coffee-slider-1.png',
  },
  {
    title: 'Caramel Macchiato',
    description:
      'Fragrant and unique classic espresso with rich caramel-peanut syrup, with cream under whipped thick foam.',
    price: 5.0,
    image: 'images/coffee-slider-2.png',
  },
  {
    title: 'Ice coffee',
    description:
      'A popular summer drink that tones and invigorates. Prepared from coffee, milk and ice.',
    price: 4.5,
    image: 'images/coffee-slider-3.png',
  },
];

/* ==========================================================================
   СОСТОЯНИЕ
   ========================================================================== */
const state = {
  products: null,
  visibleCount: { coffee: INITIAL_VISIBLE, tea: INITIAL_VISIBLE, dessert: INITIAL_VISIBLE },
};

/* ==========================================================================
   УТИЛИТЫ
   ========================================================================== */
const money = (n) => `$${n.toFixed(2)}`;

function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredTheme(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Приватный режим? Плевать, живём без персиста.
  }
}

/* ==========================================================================
   ТЕМА
   ========================================================================== */
function applyTheme(value) {
  document.documentElement.dataset.theme = value;
  document.querySelectorAll('input[name="theme"]').forEach((input) => {
    input.checked = input.value === value;
  });
}

function initTheme() {
  const stored = getStoredTheme();
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(stored || (systemPrefersDark ? 'dark' : 'light'));
}

function initThemeListeners() {
  document.querySelectorAll('input[name="theme"]').forEach((input) => {
    input.addEventListener('change', (e) => {
      const newTheme = e.target.value;
      applyTheme(newTheme);
      setStoredTheme(newTheme);
    });
  });
}

/* ==========================================================================
   БУРГЕР-МЕНЮ
   ========================================================================== */
function initBurgerMenu() {
  const toggleBtn = document.querySelector('.header__burger');
  const menu = document.getElementById('burger-menu');
  if (!toggleBtn || !menu) return; // Выход, если мы не на странице с меню

  const closeBtn = menu.querySelector('.burger-menu__close');

  function open() {
    menu.hidden = false;
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.querySelector('.burger-toggle__icon')?.classList.add('burger-toggle__icon--close');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    menu.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.querySelector('.burger-toggle__icon')?.classList.remove('burger-toggle__icon--close');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
    isOpen ? close() : open();
  });

  closeBtn?.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) close();
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', close);
  });
}

/* ==========================================================================
   МОДУЛЬ: СЛАЙДЕР (ГЛАВНАЯ)
   ========================================================================== */
function initSlider() {
  const root = document.querySelector('[data-slider]');
  if (!root) return; // Выход, если мы на menu.html

  const track = root.querySelector('[data-slider-track]');
  const dotsWrap = root.querySelector('[data-slider-dots]');
  const template = document.getElementById('slide-template');
  let index = 0;

  const fragment = document.createDocumentFragment();
  HOME_SLIDES.forEach((slide) => {
    const node = template.content.cloneNode(true);
    node.querySelector('.slider__slide-img').src = slide.image;
    node.querySelector('.slider__slide-img').alt = slide.title;
    node.querySelector('.slider__slide-title').textContent = slide.title;
    node.querySelector('.slider__slide-desc').textContent = slide.description;
    node.querySelector('.slider__slide-price').textContent = money(slide.price);
    fragment.appendChild(node);
  });
  track.appendChild(fragment);

  HOME_SLIDES.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slider__dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Слайд ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    dotsWrap.querySelectorAll('.slider__dot').forEach((dot, i) => {
      dot.classList.toggle('slider__dot--active', i === index);
      dot.setAttribute('aria-selected', String(i === index));
    });
  }

  function goTo(i) {
    index = (i + HOME_SLIDES.length) % HOME_SLIDES.length;
    update();
  }

  root.querySelector('[data-slider-prev]').addEventListener('click', () => goTo(index - 1));
  root.querySelector('[data-slider-next]').addEventListener('click', () => goTo(index + 1));

  update();
}

/* ==========================================================================
   МЕНЮ (КАРТОЧКИ + МОДАЛКА)
   ========================================================================== */
async function loadProducts() {
  const res = await fetch('products.json');
  if (!res.ok) throw new Error(`products.json: HTTP ${res.status}`);
  return res.json();
}

function renderCategory(category) {
  const grid = document.getElementById(`grid-${category}`);
  const template = document.getElementById('menu-card-template');
  const items = state.products[category] || [];
  const count = Math.min(state.visibleCount[category], items.length);

  grid.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const product = items[i];
    const node = template.content.cloneNode(true);
    const li = node.querySelector('.menu-card');
    li.dataset.productId = product.id;
    node.querySelector('.menu-card__img').src = product.image;
    node.querySelector('.menu-card__img').alt = product.title;
    node.querySelector('.menu-card__title').textContent = product.title;
    node.querySelector('.menu-card__desc').textContent = product.description;
    node.querySelector('.menu-card__price').textContent = money(product.price);
    fragment.appendChild(node);
  }

  grid.appendChild(fragment);

  const panel = grid.closest('.menu-panel');
  const loadMoreBtn = panel.querySelector('[data-load-more]');
  loadMoreBtn.hidden = count >= items.length;
}

function renderAll() {
  renderCategory('coffee');
  renderCategory('tea');
  renderCategory('dessert');
}

function initLoadMore() {
  document.querySelectorAll('[data-load-more]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.menu-panel');
      const category = panel.querySelector('.menu-grid').dataset.category;
      state.visibleCount[category] += INITIAL_VISIBLE;
      renderCategory(category);
    });
  });
}

function initTabs() {
  const tabs = Array.from(document.querySelectorAll('.tabs__button'));
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
        t.classList.toggle('tabs__button--active', selected);
        document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
      });
      tab.focus();
    });
  });
}

function initModal() {
  const modal = document.getElementById('product-modal');
  if (!modal) return; // Выход, если мы на index.html

  const img = document.getElementById('modal-img');
  const title = document.getElementById('modal-title');
  const desc = document.getElementById('modal-desc');
  const total = document.getElementById('modal-total');

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.menu-card__trigger');
    if (!trigger) return;

    const li = trigger.closest('.menu-card');
    const category = li.closest('.menu-grid').dataset.category;
    const product = state.products[category].find((p) => p.id === li.dataset.productId);
    if (!product) return;

    img.src = product.image;
    img.alt = product.title;
    title.textContent = product.title;
    desc.textContent = product.description;
    total.textContent = money(product.price);

    modal.showModal();
  });

  modal.querySelector('[data-modal-close]').addEventListener('click', () => modal.close());
}

async function initMenuPage() {
  if (!document.querySelector('.menu-grid')) return; // Выход, если сетки нет

  try {
    state.products = await loadProducts();
  } catch (err) {
    console.error('Не удалось загрузить меню:', err);
    return;
  }

  renderAll();
  initLoadMore();
  initTabs();
  initModal();
}

/* ==========================================================================
   ТОЧКА ВХОДА
   ========================================================================== */
function initApp() {
  initTheme();
  initThemeListeners();
  initBurgerMenu();
  initSlider();
  initMenuPage();
}

initTheme();
document.addEventListener('DOMContentLoaded', initApp);
