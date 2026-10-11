// Standard GA4, limited to the configured production host. No custom interaction events.
const tag = document.querySelector('script[data-measurement-id][data-allowed-host]');
const measurementId = tag?.dataset.measurementId;
if (tag && /^G-[A-Z0-9]+$/.test(measurementId) && location.hostname === tag.dataset.allowedHost) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  // Keep directory fragments and arbitrary query text out of page-view metadata.
  let referrer = "";
  try { referrer = new URL(document.referrer).origin; } catch { /* No valid referrer. */ }
  window.gtag("config", measurementId, {
    page_location: location.origin + location.pathname,
    page_referrer: referrer,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

// Event names and parameters describe general use, never a candidate or party choice.
if (tag && typeof window.gtag === "function" && location.hostname === tag.dataset.allowedHost) {
  const send = (name, parameters = {}) => window.gtag("event", name, parameters);
  document.addEventListener("click", (event) => {
    const target = event.target.closest?.("a, button, summary");
    if (!target) return;
    if (target.matches(".source-link")) send("source_opened");
    else if (target.matches(".masthead-date-link")) send("calendar_download_clicked");
    else if (target.matches(".affiliation-guide-pill")) send("affiliation_filter_used");
    else if (target.id === "nonpartisan-race-filter") send("nonpartisan_filter_used");
    else if (target.matches("summary") && !target.parentElement.open) {
      if (target.parentElement.matches(".office-disclosure")) send("race_opened");
      else if (target.parentElement.matches(".directory-category")) send("category_opened");
      else if (target.matches(".candidate-sources-summary")) send("sources_expanded");
    }
  });
  let searchTimer;
  document.addEventListener("input", (event) => {
    if (event.target.id !== "directory-search") return;
    window.clearTimeout(searchTimer);
    if (!event.target.value.trim()) return;
    searchTimer = window.setTimeout(() => {
      const count = Number(document.querySelector("[data-directory-office-count]")?.textContent || 0);
      send("directory_search_used", { result_state: count > 0 ? "matches" : "none" });
      if (!count) send("directory_search_no_results");
    }, 1000);
  });
}
