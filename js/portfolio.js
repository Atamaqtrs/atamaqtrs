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
// so these are polygons, not rectangles), then pulled in ~2px so no bezel
// shows. Work #1 in portfolio.json goes on slot 1, #2 on slot 2 … #5 on slot 5.
// Slots with no work (6–8, or any slot past the number of works) become
// "no signal" monitors: click one to bring up a test pattern.
// If server-room.png is ever replaced, re-trace these.
const STAGE_W = 1672;
const STAGE_H = 941;
const MONITOR_SLOTS = [
  [[845, 332], [839, 335], [699, 336], [697, 344], [693, 401], [693, 493], [695, 531], [700, 537], [1003, 537], [1012, 536], [1017, 532], [1019, 510], [1019, 392], [1016, 345], [1013, 332]],  // 1  center
  [[337, 311], [320, 312], [315, 315], [315, 323], [318, 330], [317, 374], [318, 379], [321, 380], [321, 397], [324, 411], [324, 426], [327, 448], [327, 471], [329, 476], [462, 476], [479, 475], [485, 473], [499, 463], [499, 421], [495, 383], [495, 380], [497, 379], [496, 367], [491, 350], [488, 323], [484, 318], [459, 311]],  // 2  left, middle
  [[1244, 125], [1200, 131], [1186, 135], [1182, 138], [1177, 175], [1181, 245], [1295, 245], [1329, 243], [1336, 239], [1335, 168], [1332, 138], [1333, 131], [1331, 125]],  // 3  right, top
  [[1202, 483], [1194, 521], [1194, 568], [1198, 578], [1226, 584], [1316, 584], [1321, 548], [1323, 491], [1317, 486], [1293, 483]],  // 4  right, bottom
  [[378, 169], [376, 218], [377, 252], [383, 255], [419, 258], [477, 258], [479, 243], [479, 207], [475, 179], [464, 173], [443, 169]],  // 5  left, top
  [[1240, 308], [1228, 311], [1226, 313], [1222, 325], [1217, 356], [1218, 411], [1220, 418], [1223, 421], [1345, 421], [1347, 418], [1348, 340], [1344, 308]],  // 6  right, middle  (empty)
  [[473, 525], [456, 526], [433, 531], [429, 534], [431, 568], [439, 622], [479, 622], [492, 615], [547, 612], [549, 606], [548, 574], [545, 550], [539, 525]],  // 7  left, bottom  (empty)
  [[969, 183], [971, 217], [996, 217], [1001, 215], [1006, 208], [1006, 193], [1005, 188], [1001, 183]],  // 8  top-center, small  (empty)
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
