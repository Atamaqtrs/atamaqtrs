// Loads data/portfolio.json and renders it in two places:
//  • index.html — each work plays on a CRT monitor in the server-room photo
//    (#server-stage); clicking a monitor opens a detail window, and the
//    "More contents" button opens a window listing every work.
//  • portfolio.html — a plain polaroid gallery (no stage).
// Detail URL shape: #/portfolio/<id>. Works with browser back/forward.
let portfolioItems = [];
let detailFromList = false; // remember whether the detail was opened from the list window

// The server-room photo is 1672×941. Each slot is the outline of one monitor's
// glass, traced from the photo's own pixels (CRT screens are slightly curved,
// so these are polygons, not rectangles) and pushed out ~1.5px so none of the
// photo's blue static / glow peeks out around the content.
// Work #1 in portfolio.json goes on slot 1, #2 on slot 2 … #5 on slot 5.
// Slots with no work (6–8, or any slot past the number of works) become
// "no signal" monitors: click one to bring up a test pattern.
// If server-room.png is ever replaced, re-trace these.
const STAGE_W = 1672;
const STAGE_H = 941;
const MONITOR_SLOTS = [
  [[786, 328], [786, 329], [706, 332], [696, 334], [694, 337], [688, 403], [688, 455], [686, 458], [686, 473], [688, 479], [688, 491], [686, 495], [686, 530], [692, 532], [696, 541], [724, 542], [724, 544], [878, 544], [878, 542], [930, 540], [1014, 539], [1020, 534], [1022, 522], [1026, 521], [1026, 508], [1024, 506], [1024, 499], [1026, 495], [1024, 491], [1024, 400], [1020, 346], [1018, 332], [1016, 330], [1004, 329], [1004, 328]],  // 1  center
  [[316, 310], [316, 312], [312, 313], [310, 316], [310, 321], [314, 335], [314, 354], [312, 356], [312, 363], [312, 379], [316, 380], [316, 402], [320, 409], [320, 428], [322, 442], [322, 449], [324, 476], [324, 478], [372, 479], [374, 482], [440, 482], [440, 480], [506, 474], [500, 473], [498, 469], [504, 461], [502, 414], [500, 385], [500, 367], [494, 347], [492, 326], [488, 318], [466, 312], [466, 310]],  // 2  left, middle
  [[1270, 120], [1270, 122], [1232, 125], [1198, 130], [1182, 134], [1178, 137], [1172, 181], [1174, 226], [1176, 246], [1178, 250], [1244, 250], [1244, 248], [1334, 243], [1340, 240], [1340, 213], [1338, 129], [1336, 125], [1332, 122], [1332, 120]],  // 3  right, top
  [[1200, 478], [1194, 494], [1194, 502], [1190, 509], [1188, 517], [1184, 569], [1190, 570], [1192, 573], [1188, 578], [1212, 585], [1266, 589], [1266, 590], [1318, 590], [1322, 579], [1328, 510], [1328, 489], [1324, 486], [1318, 484], [1280, 480], [1274, 479], [1274, 478]],  // 4  right, bottom
  [[374, 162], [372, 226], [372, 253], [380, 256], [424, 260], [432, 262], [432, 264], [480, 264], [482, 259], [484, 238], [484, 211], [480, 179], [476, 176], [470, 173], [448, 168], [418, 164], [418, 162]],  // 5  left, top
  [[1256, 304], [1256, 305], [1224, 309], [1220, 312], [1218, 325], [1214, 352], [1214, 354], [1210, 355], [1210, 358], [1214, 361], [1214, 363], [1212, 367], [1208, 369], [1208, 372], [1212, 373], [1214, 376], [1214, 410], [1216, 417], [1220, 422], [1220, 426], [1316, 426], [1316, 424], [1346, 423], [1350, 421], [1352, 417], [1350, 406], [1352, 339], [1350, 324], [1350, 307], [1340, 305], [1340, 304]],  // 6  right, middle  (empty)
  [[486, 518], [486, 520], [452, 524], [434, 528], [426, 531], [424, 534], [426, 565], [434, 628], [480, 628], [480, 626], [488, 619], [498, 616], [550, 614], [552, 612], [554, 578], [550, 552], [544, 518]],  // 7  left, bottom  (empty)
  [[962, 180], [962, 181], [966, 182], [966, 207], [966, 218], [968, 222], [990, 222], [990, 220], [1006, 216], [1010, 212], [1010, 192], [1008, 180]],  // 8  top-center, small  (empty)
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
      `--d:${(i * 1.7 + 0.4).toFixed(1)}s;--p:${(5.2 + i * 1.3).toFixed(1)}s;`;
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
