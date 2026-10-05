// Clickjacking guard: this site can't set an X-Frame-Options header on GitHub
// Pages, so if it ever gets loaded inside someone else's frame, break out of it.
if (window.top !== window.self) {
  try { window.top.location = window.self.location; } catch { /* cross-origin top: blocked */ }
}

// Highlights the active dot-nav item as the visitor scrolls between sections.
document.addEventListener("DOMContentLoaded", () => {
  const panels = document.querySelectorAll(".panel");
  const dots = document.querySelectorAll("#dot-nav a");
  if (!panels.length || !dots.length) return;

  const dotForId = (id) =>
    document.querySelector(`#dot-nav a[href="#${id}"]`);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          dots.forEach((d) => d.classList.remove("active"));
          const dot = dotForId(entry.target.id);
          if (dot) dot.classList.add("active");
        }
      });
    },
    { threshold: 0.5 }
  );

  panels.forEach((panel) => observer.observe(panel));
});

// Hero CRT screen: a small VCR-style OSD (top-left) shows the current
// transport state — ■ STOP while paused, ▶ START while playing — and
// clicking anywhere on the screen toggles playback.
document.addEventListener("DOMContentLoaded", () => {
  const screen = document.getElementById("tv-screen");
  const video = document.getElementById("tv-video");
  const icon = document.getElementById("tv-toggle-icon");
  const text = document.getElementById("tv-toggle-text");
  if (!screen || !video || !icon || !text) return;

  function updateToggleLabel() {
    const lang = document.documentElement.lang || "en";
    const playing = !video.paused;
    icon.classList.toggle("is-triangle", playing);
    icon.classList.toggle("is-square", !playing);
    text.textContent = playing ? t("hero.start", lang) : t("hero.stop", lang);
  }

  screen.addEventListener("click", () => {
    if (video.paused) video.play();
    else video.pause();
  });
  video.addEventListener("play", updateToggleLabel);
  video.addEventListener("pause", updateToggleLabel);
  document.addEventListener("langchange", updateToggleLabel);
  updateToggleLabel();
});

// Portfolio entrance: the page goes dark and the studio photo is unlit; after a
// beat its lights flicker on (.lights-on on the stage → the lit photo fades in
// and the monitors power up), then the page returns to the light theme.
// Leaving the section resets everything so the scene replays on the next visit.
document.addEventListener("DOMContentLoaded", () => {
  const portfolio = document.getElementById("portfolio");
  const stage = document.getElementById("server-stage");
  if (!portfolio || !stage || !document.getElementById("scroll-container")) return;

  const LIGHTS_ON_AT = 900;   // ms after entering: lights start flickering on
  const LIGHT_THEME_AT = 1600; // ms after entering: theme flips back to light
  let timers = [];

  new IntersectionObserver(
    ([entry]) => {
      timers.forEach(clearTimeout);
      timers = [];
      if (entry.isIntersecting) {
        document.body.classList.add("theme-dark");
        timers.push(setTimeout(() => stage.classList.add("lights-on"), LIGHTS_ON_AT));
        timers.push(setTimeout(() => document.body.classList.remove("theme-dark"), LIGHT_THEME_AT));
      } else {
        stage.classList.remove("lights-on");
        document.body.classList.remove("theme-dark");
      }
    },
    { threshold: 0.55 }
  ).observe(portfolio);
});

// Phones: the studio is wider than the screen — start it centred on the middle monitor.
document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.getElementById("stage-scroll");
  if (!wrap) return;
  const center = () => { wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2; };
  center();
  window.addEventListener("resize", center);
});
