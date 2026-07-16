export function setupPrintDisclosures() {
  let disclosureState = [];

  window.addEventListener("beforeprint", () => {
    const disclosures = Array.from(document.querySelectorAll("details"));
    disclosureState = disclosures.map((item) => item.open);
    disclosures.forEach((item) => { item.open = true; });
  });

  window.addEventListener("afterprint", () => {
    document.querySelectorAll("details").forEach((item, index) => {
      item.open = disclosureState[index] || false;
    });
  });
}

export function showFatalApplicationError(error) {
  const status = document.querySelector("#directory-status");
  if (status) {
    status.textContent = "The civic reference could not be loaded. Reload the page or contact the site administrator if the problem continues.";
    status.classList.add("directory-error");
    status.setAttribute("role", "alert");
    status.setAttribute("aria-live", "assertive");
    status.tabIndex = 0;
    status.focus();
  }
  console.error("Application initialization failed:", error);
}
