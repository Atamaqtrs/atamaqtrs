// Loads data/portfolio.json and renders it in two places:
//  • index.html — each work plays on a CRT monitor in the server-room photo
//    (#server-stage); clicking a monitor opens a detail window, and the
//    "More contents" button opens a window listing every work.
//  • portfolio.html — a plain polaroid gallery (no stage).
// Detail URL shape: #/portfolio/<id>. Works with browser back/forward.
let portfolioItems = [];
let detailFromList = false; // remember whether the detail was opened from the list window

// The server-room photo is 1672×941. Each slot is the screen of one monitor as
// a quadrilateral (top-left, top-right, bottom-right, bottom-left) in that
// photo's pixels. Work #1 in portfolio.json goes on slot 1, #2 on slot 2, etc.
// If server-room.png is ever replaced, re-measure these.
const STAGE_W = 1672;
const STAGE_H = 941;
const MONITOR_SLOTS = [
  [[690, 328], [1022, 326], [1024, 540], [690, 542]],   // 1  center
  [[314, 310], [504, 320], [506, 468], [328, 480]],     // 2  left, middle
  [[1176, 132], [1338, 120], [1340, 244], [1176, 250]], // 3  right, top
  [[1196, 478], [1326, 486], [1320, 590], [1190, 580]], // 4  right, bottom
  [[374, 158], [478, 174], [480, 262], [374, 254]],     // 5  left, top
];

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
  renderStage();
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

function portfolioCard(item) {
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

// ----- CRT monitors in the server room -----
function renderStage() {
  const stage = document.getElementById("server-stage");
  if (!stage) return;
  stage.querySelectorAll(".monitor").forEach((m) => m.remove());
  const lang = currentLang();

  MONITOR_SLOTS.forEach((quad, i) => {
    const item = portfolioItems[i];
    if (!item) return;
    const xs = quad.map((p) => p[0]);
    const ys = quad.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const w = x1 - x0, h = y1 - y0;
    const poly = quad
      .map(([x, y]) => `${(((x - x0) / w) * 100).toFixed(2)}% ${(((y - y0) / h) * 100).toFixed(2)}%`)
      .join(", ");
    const title = item.title[lang] || item.title.en;

    const a = document.createElement("a");
    a.className = "monitor";
    a.dataset.caption = `CH ${String(i + 1).padStart(2, "0")} — ${title}`;
    a.href = `#/portfolio/${item.id}`;
    a.setAttribute("aria-label", title);
    a.style.cssText =
      `left:${(x0 / STAGE_W) * 100}%;top:${(y0 / STAGE_H) * 100}%;` +
      `width:${(w / STAGE_W) * 100}%;height:${(h / STAGE_H) * 100}%;` +
      `clip-path:polygon(${poly});` +
      // absolute: a url() inside a custom property resolves against the stylesheet, not the page
      `--img:url("${new URL(item.thumbnail, location.href).href}");` +
      // different glitch timing per monitor so they don't flash in unison
      `--d:${(i * 1.7 + 0.4).toFixed(1)}s;--p:${(5.2 + i * 1.3).toFixed(1)}s;`;
    a.innerHTML = `
      <span class="m-img"></span>
      <span class="m-ghost m-ghost-r"></span>
      <span class="m-ghost m-ghost-c"></span>
      <span class="m-tint"></span>
      <span class="m-scan"></span>
      <span class="m-bar"></span>
      <span class="m-vig"></span>
      <span class="m-ch">CH ${String(i + 1).padStart(2, "0")}</span>
    `;
    stage.appendChild(a);
  });
}

// ----- windows -----
function setModalOpen() {
  const anyOpen = [...document.querySelectorAll(".modal")].some((m) => !m.hidden);
  document.body.classList.toggle("modal-open", anyOpen);
}

function openList() {
  const modal = document.getElementById("portfolio-list-modal");
  if (!modal) return;
  modal.hidden = false;
  setModalOpen();
}

function closeList() {
  const modal = document.getElementById("portfolio-list-modal");
  if (!modal) return;
  modal.hidden = true;
  setModalOpen();
}

function renderPortfolioDetail(id) {
  const item = portfolioItems.find((p) => p.id === id);
  const gridSection = document.getElementById("portfolio-grid");
  const detail = document.getElementById("portfolio-detail");
  const stageMode = !!document.getElementById("server-stage");
  if (!detail) return;

  if (!item) {
    detail.hidden = true;
    if (gridSection && !stageMode) gridSection.hidden = false;
    setModalOpen();
    return;
  }

  const lang = currentLang();
  if (stageMode) {
    // The list window (if it was the way in) steps aside; the room stays behind.
    const listModal = document.getElementById("portfolio-list-modal");
    if (listModal && !listModal.hidden) detailFromList = true;
    closeList();
  } else if (gridSection) {
    gridSection.hidden = true;
  }
  detail.hidden = false;
  detail.querySelector(".modal-window, .portfolio-detail-content")?.scrollTo?.(0, 0);
  setModalOpen();
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
    .forEach((p) => otherGrid.appendChild(portfolioCard(p)));
}

function handlePortfolioRoute() {
  const match = location.hash.match(/^#\/portfolio\/(.+)$/);
  const scrollContainer = document.getElementById("scroll-container");
  const stageMode = !!document.getElementById("server-stage");
  if (match) {
    // gallery page (portfolio.html) has no scroller; on index the detail is a
    // fixed window, so snapping can stay on.
    if (scrollContainer && !stageMode) scrollContainer.classList.add("no-snap");
    renderPortfolioDetail(match[1]);
  } else {
    const detail = document.getElementById("portfolio-detail");
    const gridSection = document.getElementById("portfolio-grid");
    if (detail) detail.hidden = true;
    if (gridSection && !stageMode) gridSection.hidden = false;
    if (scrollContainer) scrollContainer.classList.remove("no-snap");
    setModalOpen();
  }
}

function closeDetail() {
  history.pushState(null, "", "#portfolio");
  handlePortfolioRoute();
  if (document.getElementById("server-stage")) {
    if (detailFromList) openList();
    detailFromList = false;
  } else {
    document.getElementById("portfolio")?.scrollIntoView();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPortfolio();

  document.addEventListener("click", (e) => {
    if (e.target.closest(".portfolio-back")) {
      e.preventDefault();
      closeDetail();
      return;
    }
    if (e.target.closest("#more-contents")) {
      openList();
      return;
    }
    // ✕ button, or a click on the dark backdrop around a list window
    const listModal = document.getElementById("portfolio-list-modal");
    if (listModal && !listModal.hidden &&
        (e.target.closest("[data-close]") || e.target === listModal)) {
      closeList();
      return;
    }
    const detail = document.getElementById("portfolio-detail");
    if (detail && !detail.hidden && e.target === detail && document.getElementById("server-stage")) {
      closeDetail();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const detail = document.getElementById("portfolio-detail");
    if (detail && !detail.hidden && document.getElementById("server-stage")) closeDetail();
    else closeList();
  });

  // Hovering / focusing a monitor names the work in the caption line below the room.
  const caption = () => document.getElementById("stage-caption");
  const showCaption = (e) => {
    const m = e.target.closest?.(".monitor");
    const el = caption();
    if (m && el) el.textContent = m.dataset.caption;
  };
  const resetCaption = (e) => {
    const el = caption();
    if (el && e.target.closest?.(".monitor")) el.textContent = t("portfolio.hint", currentLang());
  };
  document.addEventListener("mouseover", showCaption);
  document.addEventListener("focusin", showCaption);
  document.addEventListener("mouseout", resetCaption);
  document.addEventListener("focusout", resetCaption);

  window.addEventListener("hashchange", handlePortfolioRoute);
  document.addEventListener("langchange", () => {
    renderPortfolio();
    renderStage();
    handlePortfolioRoute();
  });
});
