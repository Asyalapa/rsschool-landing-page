/* ===== КОНСТАНТЫ И ДАННЫЕ ===== */
const STORAGE_KEY = 'theme';
const DESKTOP_QUERY = '(min-width: 769px)';
const VISIBLE_DESKTOP = 8;
const VISIBLE_MOBILE = 4;

function getInitialVisible() {
  return window.matchMedia(DESKTOP_QUERY).matches ? VISIBLE_DESKTOP : VISIBLE_MOBILE;
}

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

/* ===== СОСТОЯНИЕ ===== */
const state = {
  products: null,
  activeCategory: 'coffee',
  visibleCount: getInitialVisible(),
};

/* ===== УТИЛИТЫ ===== */
const money = (n) => `$${n.toFixed(2)}`;
const toNumber = (str) => parseFloat(str);

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
    return null;
  }
}

/* ===== ТЕМА ===== */
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

/* ===== БУРГЕР-МЕНЮ ===== */
function initBurgerMenu() {
  const toggleBtn = document.querySelector('.header__burger');
  const menu = document.getElementById('burger-menu');
  if (!toggleBtn || !menu) return;

  const closeBtn = menu.querySelector('.burger-menu__close');

  function open() {
    menu.hidden = false;
    toggleBtn.setAttribute('aria-expanded', 'true');
    const icon = toggleBtn.querySelector('.burger-toggle__icon');
    if (icon) icon.classList.add('burger-toggle__icon--close');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    menu.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
    const icon = toggleBtn.querySelector('.burger-toggle__icon');
    if (icon) icon.classList.remove('burger-toggle__icon--close');
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

  window.matchMedia('(min-width: 769px)').addEventListener('change', (e) => {
    if (e.matches) close();
  });
}

/* ===== МОДУЛЬ: СЛАЙДЕР ===== */
function initSlider() {
  const root = document.querySelector('[data-slider]');
  if (!root) return;

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
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
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

/* ===== СТРАНИЦА МЕНЮ ===== */
async function loadProducts() {
  const res = await fetch('products.json');
  if (!res.ok) throw new Error(`products.json: HTTP ${res.status}`);
  return res.json();
}

function normalizeProducts(rawList) {
  const grouped = {};

  rawList.forEach((item) => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  });

  return grouped;
}

function getCurrentItems() {
  return state.products[state.activeCategory] || [];
}

function createCard(product) {
  const template = document.getElementById('menu-card-template');
  const node = template.content.cloneNode(true);
  const li = node.querySelector('.menu-card');
  li.dataset.productId = product.id;
  li.dataset.category = product.category;
  node.querySelector('.menu-card__img').src = product.image;
  node.querySelector('.menu-card__title').textContent = product.name;
  node.querySelector('.menu-card__desc').textContent = product.description;
  node.querySelector('.menu-card__price').textContent = money(toNumber(product.price));
  return node;
}

function appendCards(items, from, to) {
  const grid = document.getElementById('menu-grid');
  const fragment = document.createDocumentFragment();
  for (let i = from; i < to; i += 1) {
    fragment.appendChild(createCard(items[i]));
  }
  grid.appendChild(fragment);
}

function updateLoadMore(items) {
  document.querySelector('[data-load-more]').hidden = state.visibleCount >= items.length;
}

function renderMenu() {
  const items = getCurrentItems();
  state.visibleCount = Math.min(state.visibleCount, items.length);

  document.getElementById('menu-grid').replaceChildren();
  appendCards(items, 0, state.visibleCount);
  updateLoadMore(items);
}

function showMore() {
  const grid = document.getElementById('menu-grid');
  const items = getCurrentItems();
  const from = state.visibleCount;

  state.visibleCount = Math.min(from + getInitialVisible(), items.length);
  appendCards(items, from, state.visibleCount);
  updateLoadMore(items);

  grid.children[from]?.querySelector('.menu-card__trigger')?.focus({ preventScroll: true });
}

function initLoadMore() {
  document.querySelector('[data-load-more]').addEventListener('click', showMore);
}

function initFilters() {
  const buttons = document.querySelectorAll('.tabs__button');

  const setActive = (category) => {
    buttons.forEach((b) => {
      const active = b.dataset.category === category;
      b.classList.toggle('tabs__button--active', active);
      b.setAttribute('aria-selected', String(active));
      b.tabIndex = active ? 0 : -1;
    });
  };

  setActive(state.activeCategory);

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.category === state.activeCategory) return;
      state.activeCategory = btn.dataset.category;
      state.visibleCount = getInitialVisible();
      setActive(state.activeCategory);
      renderMenu();
    });
  });
}

function initResponsiveGrid() {
  window.matchMedia(DESKTOP_QUERY).addEventListener('change', () => {
    state.visibleCount = getInitialVisible();
    renderMenu();
  });
}

function initModal() {
  const modal = document.getElementById('product-modal');
  if (!modal) return;

  const img = document.getElementById('modal-img');
  const title = document.getElementById('modal-title');
  const desc = document.getElementById('modal-desc');
  const total = document.getElementById('modal-total');
  const [sizeGroup, additiveGroup] = modal.querySelectorAll('.modal__group');
  const sizeOptions = sizeGroup.querySelector('.modal__options');
  const additiveOptions = additiveGroup.querySelector('.modal__options');

  let currentProduct = null;

  function renderOptions(product) {
    sizeOptions.innerHTML = Object.entries(product.sizes)
      .map(
        ([key, s], i) => `
        <label class="modal__option">
          <input type="radio" name="size" value="${key}" class="modal__option-input" ${i === 0 ? 'checked' : ''}>
          <span class="modal__option-icon" aria-hidden="true">${key.toUpperCase()}</span>
          <span class="modal__option-label">${s.size}</span>
        </label>`,
      )
      .join('');

    additiveOptions.innerHTML = product.additives
      .map(
        (a, i) => `
        <label class="modal__option">
          <input type="checkbox" name="additive" value="${a.name}" class="modal__option-input">
          <span class="modal__option-icon" aria-hidden="true">${i + 1}</span>
          <span class="modal__option-label">${a.name}</span>
        </label>`,
      )
      .join('');
  }

  function updateTotal() {
    if (!currentProduct) return;

    const sizeKey = modal.querySelector('input[name="size"]:checked')?.value;
    const sizeSurcharge = toNumber(currentProduct.sizes[sizeKey]?.['add-price'] ?? '0');

    const additivesSum = [...modal.querySelectorAll('input[name="additive"]:checked')].reduce(
      (sum, input) => {
        const additive = currentProduct.additives.find((a) => a.name === input.value);
        return sum + toNumber(additive?.['add-price'] ?? '0');
      },
      0,
    );

    total.textContent = money(toNumber(currentProduct.price) + sizeSurcharge + additivesSum);
  }

  document.getElementById('menu-grid').addEventListener('click', (e) => {
    const trigger = e.target.closest('.menu-card__trigger');
    if (!trigger) return;

    const { category, productId } = trigger.closest('.menu-card').dataset;
    const product = state.products[category]?.find((p) => p.id === productId);
    if (!product) return;

    currentProduct = product;
    img.src = product.image;
    img.alt = product.name;
    title.textContent = product.name;
    desc.textContent = product.description;

    renderOptions(product);
    updateTotal();

    modal.showModal();
    document.body.style.overflow = 'hidden';
  });

  modal.addEventListener('change', (e) => {
    if (e.target.name === 'size' || e.target.name === 'additive') updateTotal();
  });

  modal.querySelector('[data-modal-close]').addEventListener('click', () => modal.close());
  modal.addEventListener('close', () => {
    document.body.style.overflow = '';
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });
}
async function initMenuPage() {
  const grid = document.getElementById('menu-grid');
  if (!grid) return;

  try {
    state.products = normalizeProducts(await loadProducts());
  } catch (err) {
    console.error('Failed to load the menu:', err);
    const li = document.createElement('li');
    li.textContent = 'Failed to load the menu. Please try again later.';
    grid.appendChild(li);
    return;
  }

  renderMenu();
  initFilters();
  initLoadMore();
  initResponsiveGrid();
  initModal();
}

function initApp() {
  initTheme();
  initThemeListeners();
  initBurgerMenu();
  initSlider();
  initMenuPage().catch((err) => console.error('Menu init failed:', err));
}

document.addEventListener('DOMContentLoaded', initApp);
