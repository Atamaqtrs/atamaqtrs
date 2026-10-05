// Commission form → sends an email via EmailJS (no backend needed, works on GitHub Pages).
//
// SETUP (see README.md "Commission form email setup" for full steps):
//   1. Create a free account at https://www.emailjs.com
//   2. Add an Email Service (e.g. connect your Gmail) → copy its Service ID.
//   3. Create an Email Template with variables: {{name}} {{email}} {{company}} {{message}}
//      → copy its Template ID.
//   4. Account → General → copy your Public Key.
//   5. Paste all three below. Until you do, the form will show an error on submit.
const EMAILJS_PUBLIC_KEY = "TKbZBJqSgurlsXuAc";
const EMAILJS_SERVICE_ID = "service_bwirl2i";
const EMAILJS_TEMPLATE_ID = "template_oxx29zu";

function commissionConfigured() {
  return (
    !EMAILJS_PUBLIC_KEY.startsWith("REPLACE_") &&
    !EMAILJS_SERVICE_ID.startsWith("REPLACE_") &&
    !EMAILJS_TEMPLATE_ID.startsWith("REPLACE_")
  );
}

// Spam guards (no backend to lean on): a honeypot field, and a cooldown so one
// browser can't fire the form repeatedly. Real throttling/allow-listing lives in
// the EmailJS dashboard (see README "Security").
const COOLDOWN_MS = 60 * 1000;
const LAST_SENT_KEY = "commission-last-sent";
function lastSentAt() {
  try { return Number(localStorage.getItem(LAST_SENT_KEY)) || 0; } catch { return 0; }
}
function markSent() {
  try { localStorage.setItem(LAST_SENT_KEY, String(Date.now())); } catch { /* private mode: skip */ }
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setStatus(el, message, kind) {
  el.textContent = message;
  el.classList.remove("error", "success");
  if (kind) el.classList.add(kind);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("commission-form");
  if (!form) return;

  if (window.emailjs && commissionConfigured()) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  const status = document.getElementById("commission-status");
  const submitBtn = document.getElementById("commission-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const lang = document.documentElement.lang || "en";

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const company = form.company.value.trim();
    const message = form.message.value.trim();

    // Honeypot filled → a bot. Pretend it worked, send nothing.
    if (form.website && form.website.value) {
      form.reset();
      form.hidden = true;
      setStatus(status, t("commission.success", lang), "success");
      return;
    }

    if (!name || !email || !message || !EMAIL_RE.test(email)) {
      setStatus(status, t("commission.error.required", lang), "error");
      return;
    }

    if (!commissionConfigured()) {
      setStatus(status, t("commission.error", lang), "error");
      console.warn("EmailJS is not configured yet — see js/commission.js top of file.");
      return;
    }

    if (Date.now() - lastSentAt() < COOLDOWN_MS) {
      setStatus(status, t("commission.wait", lang), "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus(status, t("commission.sending", lang));

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        name,
        email,
        company: company || "-",
        message
      });
      markSent();
      form.reset();
      form.hidden = true;
      setStatus(status, t("commission.success", lang), "success");
    } catch (err) {
      console.error("EmailJS send failed", err);
      setStatus(status, t("commission.error", lang), "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
});
