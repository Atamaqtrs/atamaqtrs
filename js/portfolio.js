// Loads data/portfolio.json and renders the grid + hash-routed detail view.
// URL shape: #/portfolio/<id>  (e.g. #/portfolio/work-01) shows the detail overlay;
// any other hash (or none) shows the grid. Works with browser back/forward.
let portfolioItems = [];

async function loadPortfolio() {
  try {
    const res = await fetch("data/portfolio.json");
    portfolioItems = await res.json();
  } catch (err) {
    console.error("Failed to load portfolio.json", err);
    portfolioItems = [];
  }
  renderPortfolio();
  handlePortfolioRoute();
}

function currentLang() {
  return document.documentElement.lang || "en";
}

function portfolioCard(item, small) {
  const lang = currentLang();
  const card = document.createElement("a");
  card.href = `#/portfolio/${item.id}`;
  card.className = "portfolio-card";
  card.innerHTML = `
    <img src="${item.thumbnail}" alt="${item.title[lang] || item.title.en}" loading="lazy" />
    <figcaption>
      <div class="p-title">${item.title[lang] || item.title.en}</div>
      <div class="p-meta">${item.year} · ${item.category[lang] || item.category.en}</div>
    </figcaption>
  `;
  return card;
}

function renderPortfolio() {
  const grid = document.getElementById("portfolio-grid");
  if (!grid) return;
  grid.innerHTML = "";
  portfolioItems.forEach((item) => grid.appendChild(portfolioCard(item)));
}

function renderPortfolioDetail(id) {
  const item = portfolioItems.find((p) => p.id === id);
  const gridSection = document.getElementById("portfolio-grid");
  const detail = document.getElementById("portfolio-detail");
  if (!detail) return;

  if (!item) {
    detail.hidden = true;
    if (gridSection) gridSection.hidden = false;
    return;
  }

  const lang = currentLang();
  gridSection.hidden = true;
  detail.hidden = false;
  document.getElementById("portfolio")?.scrollIntoView({ behavior: "auto" });

  const content = detail.querySelector(".portfolio-detail-content");
  content.innerHTML = `
    ${item.images.map((src) => `<img src="${src}" alt="${item.title[lang] || item.title.en}" />`).join("")}
    <h3>${item.title[lang] || item.title.en}</h3>
    <p class="p-desc">${item.description[lang] || item.description.en}</p>
  `;

  const otherGrid = document.getElementById("portfolio-other-grid");
  otherGrid.innerHTML = "";
  portfolioItems
    .filter((p) => p.id !== id)
    .forEach((p) => otherGrid.appendChild(portfolioCard(p, true)));
}

function handlePortfolioRoute() {
  const match = location.hash.match(/^#\/portfolio\/(.+)$/);
  const scrollContainer = document.getElementById("scroll-container");
  if (match) {
    if (scrollContainer) scrollContainer.classList.add("no-snap");
    renderPortfolioDetail(match[1]);
  } else {
    const detail = document.getElementById("portfolio-detail");
    const gridSection = document.getElementById("portfolio-grid");
    if (detail) detail.hidden = true;
    if (gridSection) gridSection.hidden = false;
    if (scrollContainer) scrollContainer.classList.remove("no-snap");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPortfolio();

  document.addEventListener("click", (e) => {
    const back = e.target.closest(".portfolio-back");
    if (back) {
      e.preventDefault();
      history.pushState(null, "", "#portfolio");
      handlePortfolioRoute();
      document.getElementById("portfolio")?.scrollIntoView();
    }
  });

  window.addEventListener("hashchange", handlePortfolioRoute);
  document.addEventListener("langchange", () => {
    renderPortfolio();
    handlePortfolioRoute();
  });
});
