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

    if (!name || !email || !message) {
      setStatus(status, t("commission.error.required", lang), "error");
      return;
    }

    if (!commissionConfigured()) {
      setStatus(status, t("commission.error", lang), "error");
      console.warn("EmailJS is not configured yet — see js/commission.js top of file.");
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
