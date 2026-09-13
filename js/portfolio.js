// Loads data/portfolio.json and renders the grid + hash-routed detail view.
// URL shape: #/portfolio/<id>  (e.g. #/portfolio/work-01) shows the detail overlay;
// any other hash (or none) shows the grid. Works with browser back/forward.
let portfolioItems = [];

async function loadPortfolio() {
  try {
    // GitHub Pages' CDN caches static files regardless of fetch's cache mode, so
    // a plain fetch can serve a stale copy after portfolio.json is edited. A
    // cache-busting query forces every page load to get the current file.
    const res = await fetch(`data/portfolio.json?_=${Date.now()}`);
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

// Portfolio text comes from data/portfolio.json (free-text titles/descriptions),
// but gets inserted via innerHTML — escape it so stray "<"/">" (e.g. a title
// quoted like <Show Name>) can't be swallowed as an HTML tag or, worse, injected.
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function portfolioCard(item, small) {
  const lang = currentLang();
  const title = escapeHtml(item.title[lang] || item.title.en);
  const category = escapeHtml(item.category[lang] || item.category.en);
  const card = document.createElement("a");
  card.href = `#/portfolio/${item.id}`;
  card.className = "portfolio-card";
  card.innerHTML = `
    <img src="${item.thumbnail}" alt="${title}" loading="lazy" />
    <figcaption>
      <div class="p-title">${title}</div>
      <div class="p-meta">${escapeHtml(item.year)} · ${category}</div>
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
  const title = escapeHtml(item.title[lang] || item.title.en);
  const description = escapeHtml(item.description[lang] || item.description.en);
  const linkHtml = item.link
    ? `<a class="p-link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("portfolio.viewLink", lang))}</a>`
    : "";
  content.innerHTML = `
    ${item.images.map((src) => `<img src="${src}" alt="${title}" />`).join("")}
    <h3>${title}</h3>
    <p class="p-desc">${description}</p>
    ${linkHtml}
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
