export function setupNavigation() {
  const header = document.querySelector(".site-header");
  const button = document.querySelector(".navigation-toggle");
  const nav = document.querySelector("#page-navigation");
  if (!header || !button || !nav) return;
  button.hidden = false;
  header.classList.add("navigation-ready");
  function setOpen(open, restoreFocus = false) {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    header.classList.toggle("navigation-open", open);
    if (restoreFocus) button.focus();
  }
  button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && header.classList.contains("navigation-open")) setOpen(false, true);
  });
  document.addEventListener("click", event => {
    if (!header.contains(event.target)) setOpen(false);
  });
  nav.addEventListener("click", event => { if (event.target.closest("a")) setOpen(false); });
  window.matchMedia("(max-width: 48rem)").addEventListener("change", () => setOpen(false));
}
