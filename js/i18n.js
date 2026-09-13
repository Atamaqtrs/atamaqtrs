// Simple i18n dictionary + language switcher. EN/JA only.
// Every user-facing string lives here. To add a language, add a key to each entry
// and a button in index.html's #lang-switch.
const translations = {
  "nav.about": { en: "About", ja: "紹介" },
  "nav.music": { en: "Music", ja: "音楽" },
  "nav.portfolio": { en: "Portfolio", ja: "ポートフォリオ" },
  "nav.commission": { en: "Commission", ja: "コミッション" },

  "hero.enter": { en: "Scroll to begin", ja: "スクロールして開始" },
  "hero.start": { en: "START", ja: "再生" },
  "hero.stop": { en: "STOP", ja: "停止" },

  "about.heading": { en: "About", ja: "紹介" },
  "about.body.line1": {
    en: "Hi, I'm Atama — a shoegaze artist, music producer, and engineer.",
    ja: "こんにちは、シューゲイザーアーティスト兼音楽プロデューサー・エンジニアのAtamaです。"
  },
  "about.body.line2": {
    en: "Let me share music where your colors and mine can blend together.",
    ja: "あなたの色と私の色を混ぜ合わせられる音楽をお届けします。"
  },
  "about.education.heading": { en: "Education", ja: "学歴" },
  "about.education.placeholder": {
    en: "Musicians Institute — A.S. in Studio Recording, Graduate",
    ja: "Musicians Institute · Studio Recording 準学士(A.S.)卒業"
  },

  "music.heading": { en: "Music", ja: "音楽" },
  "music.more": { en: "More Music →", ja: "もっと聴く →" },

  "portfolio.heading": { en: "Portfolio", ja: "ポートフォリオ" },
  "portfolio.back": { en: "← Back to list", ja: "← 一覧に戻る" },
  "portfolio.other": { en: "More work", ja: "他の作品" },
  "portfolio.viewAll": { en: "See more portfolio →", ja: "もっと見る →" },
  "portfolio.gallery.back": { en: "← Atamaqtrs", ja: "← Atamaqtrs" },

  "commission.name": { en: "Name", ja: "お名前" },
  "commission.name.required": { en: "Name (required)", ja: "お名前（必須）" },
  "commission.email": { en: "Email", ja: "メールアドレス" },
  "commission.email.required": { en: "Email (required)", ja: "メールアドレス（必須）" },
  "commission.company": { en: "Company (optional)", ja: "会社・所属（任意）" },
  "commission.message": { en: "Request Details", ja: "依頼内容" },
  "commission.message.required": { en: "Request Details (required)", ja: "依頼内容（必須）" },
  "commission.submit": { en: "Send", ja: "送信" },
  "commission.sending": { en: "Sending...", ja: "送信中..." },
  "commission.success": {
    en: "Thank you. I'll be in touch soon.",
    ja: "ご連絡いたします。ありがとうございます。"
  },
  "commission.error": {
    en: "Something went wrong. Please try again in a moment.",
    ja: "送信に失敗しました。しばらくしてからもう一度お試しください。"
  },
  "commission.error.required": {
    en: "Please fill in all required fields.",
    ja: "必須項目をすべて入力してください。"
  }
};

const LANG_STORAGE_KEY = "site-lang";
const SUPPORTED_LANGS = ["en", "ja"];

function getLang() {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  const browserLang = (navigator.language || "en").slice(0, 2);
  return SUPPORTED_LANGS.includes(browserLang) ? browserLang : "en";
}

function t(key, lang) {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
}

function applyLang(lang) {
  document.documentElement.lang = lang;
  localStorage.setItem(LANG_STORAGE_KEY, lang);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key, lang);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", t(key, lang));
  });

  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-lang-btn") === lang);
  });

  // Re-render any language-dependent dynamic content (portfolio grid, detail view).
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

function initI18n() {
  const lang = getLang();
  applyLang(lang);

  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.getAttribute("data-lang-btn")));
  });
}

document.addEventListener("DOMContentLoaded", initI18n);
