export function setupDirectoryLinks() {
  function reveal(hash, focus = false) {
    if (!/^#[a-z0-9-]+$/.test(hash)) return;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    if (target.closest("#candidate-directory")) {
      document.dispatchEvent(new CustomEvent("directory:navigate"));
    }
    let disclosure = target.matches("details") ? target : target.closest("details");
    while (disclosure) {
      disclosure.open = true;
      disclosure = disclosure.parentElement?.closest("details");
    }
    if (focus) {
      const focusTarget = target.matches("details") ? target.querySelector("summary") : target;
      if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
      focusTarget.focus({ preventScroll: true });
      target.scrollIntoView({ block: "start" });
    }
  }
  document.querySelectorAll('.hero a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const hash = link.getAttribute("href");
      history.pushState(null, "", hash);
      reveal(hash, true);
    });
  });
  window.addEventListener("hashchange", () => reveal(location.hash, true));
  if (location.hash) reveal(location.hash);
}
