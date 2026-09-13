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
