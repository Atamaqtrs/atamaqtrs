// Loads data/portfolio.json and renders it in two places:
//  • index.html — each work plays on a CRT monitor in the server-room photo
//    (#server-stage); clicking a monitor opens a detail window, and the
//    "More contents" button opens a window listing every work.
//  • portfolio.html — a plain polaroid gallery (no stage).
// Detail URL shape: #/portfolio/<id>. Works with browser back/forward.
let portfolioItems = [];
let detailFromList = false; // remember whether the detail was opened from the list window

// The studio photo (assets/img/studio-lit.jpg) is 1672×941. Each slot is the
// outline of one monitor's glass, traced from the photo's own pixels (CRT
// screens are slightly curved, so these are polygons, not rectangles) and
// pushed out ~2px so none of the photo's own blue screen glow peeks out.
// Work #1 in portfolio.json goes on slot 1, #2 on slot 2 … #5 on slot 5.
// Slots with no work (6–8, or any slot past the number of works) become
// "no signal" monitors: click one to bring up a test pattern.
// If studio-lit.jpg is ever replaced, re-trace these.
const STAGE_W = 1672;
const STAGE_H = 941;
const MONITOR_SLOTS = [
  [[743, 699], [745, 674], [748, 656], [755, 645], [761, 641], [785, 635], [803, 633], [839, 631], [874, 631], [912, 634], [919, 636], [930, 643], [932, 649], [933, 685], [932, 754], [931, 767], [930, 768], [907, 770], [870, 772], [785, 772], [748, 768], [744, 749]],  // 1  center
  [[302, 545], [308, 516], [313, 507], [319, 504], [330, 502], [343, 503], [411, 519], [421, 522], [423, 530], [423, 570], [418, 599], [415, 604], [346, 596], [304, 588]],  // 2  far left, upper
  [[1298, 706], [1299, 697], [1303, 686], [1309, 684], [1339, 679], [1372, 680], [1376, 683], [1377, 688], [1379, 709], [1380, 744], [1368, 747], [1324, 748], [1304, 747], [1298, 722]],  // 3  far right, lower
  [[573, 437], [576, 415], [583, 391], [588, 391], [605, 395], [624, 401], [633, 406], [633, 413], [632, 425], [625, 450], [622, 456], [576, 443], [573, 441]],  // 4  between left and center (hanging)
  [[802, 370], [805, 367], [825, 357], [879, 355], [880, 356], [884, 382], [884, 414], [846, 421], [807, 424], [804, 420]],  // 5  top center (hanging)
  [[301, 712], [306, 637], [308, 632], [356, 632], [398, 637], [414, 642], [416, 650], [417, 678], [413, 711], [409, 720], [406, 722], [381, 722], [330, 718], [302, 715]],  // 6  far left, lower  (empty)
  [[1294, 614], [1298, 597], [1316, 587], [1371, 584], [1373, 588], [1376, 612], [1377, 644], [1376, 646], [1367, 648], [1301, 654], [1297, 651], [1294, 630]],  // 7  far right, upper  (empty)
  [[1364, 382], [1365, 363], [1366, 361], [1369, 360], [1402, 357], [1436, 361], [1442, 362], [1443, 364], [1445, 383], [1445, 416], [1441, 419], [1386, 418], [1365, 415]],  // 8  top right (hanging)  (empty)
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
const TEST_SIGNAL = `
  <span class="m-signal">
    <span class="m-bars"></span>
    <span class="m-bars-low"></span>
    <span class="m-nosig">NO SIGNAL</span>
  </span>`;

function renderStage() {
  const stage = document.getElementById("server-stage");
  if (!stage) return;
  stage.querySelectorAll(".monitor").forEach((m) => m.remove());
  const lang = currentLang();

  MONITOR_SLOTS.forEach((outline, i) => {
    const item = portfolioItems[i];
    const xs = outline.map((p) => p[0]);
    const ys = outline.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const w = x1 - x0, h = y1 - y0;
    const poly = outline
      .map(([x, y]) => `${(((x - x0) / w) * 100).toFixed(2)}% ${(((y - y0) / h) * 100).toFixed(2)}%`)
      .join(", ");
    const ch = `CH ${String(i + 1).padStart(2, "0")}`;

    // A work → link to its detail; no work → a button that shows the test signal.
    const el = document.createElement(item ? "a" : "button");
    el.className = item ? "monitor" : "monitor monitor-empty";
    if (item) el.href = `#/portfolio/${item.id}`;
    else el.type = "button";
    const title = item ? (item.title[lang] || item.title.en) : "NO SIGNAL";
    el.setAttribute("aria-label", title);
    el.dataset.caption = `${ch} — ${title}`;
    el.style.cssText =
      `left:${(x0 / STAGE_W) * 100}%;top:${(y0 / STAGE_H) * 100}%;` +
      `width:${(w / STAGE_W) * 100}%;height:${(h / STAGE_H) * 100}%;` +
      `clip-path:polygon(${poly});` +
      (item
        // absolute: a url() inside a custom property resolves against the stylesheet, not the page
        ? `--img:url("${new URL(item.thumbnail, location.href).href}");`
        : "") +
      // different glitch timing per monitor so they don't flash in unison
      `--n:${i};--d:${(i * 1.7 + 0.4).toFixed(1)}s;--p:${(5.2 + i * 1.3).toFixed(1)}s;`;
    el.innerHTML = item
      ? `<span class="m-img"></span>
         <span class="m-ghost m-ghost-r"></span>
         <span class="m-ghost m-ghost-c"></span>
         <span class="m-tint"></span>
         <span class="m-scan"></span>
         <span class="m-bar"></span>
         <span class="m-vig"></span>
         <span class="m-ch">${ch}</span>`
      : `${TEST_SIGNAL}
         <span class="m-scan"></span>
         <span class="m-vig"></span>`;
    stage.appendChild(el);
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
    const empty = e.target.closest(".monitor-empty");
    if (empty) {
      empty.classList.toggle("show-signal");
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
