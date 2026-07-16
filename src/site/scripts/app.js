import { setupPrintDisclosures, showFatalApplicationError } from "./accessibility.js";
import { loadPublicationData } from "./data-loader.js";
import { initializeDirectory } from "./render-directory.js";

async function initializeApplication() {
  const { content, directory } = await loadPublicationData();
  const siteConfig = {
    lastReviewed: content.election.lastReviewed,
    electionDay: content.election.dateDisplay,
    correctionEmail: content.guide.correctionEmail
  };

  initializeDirectory({
    siteConfig,
    interfaceCopy: content.interfaceCopy,
    electionData: directory.offices,
    categorySummaryData: directory.categorySummaries
  });
  setupPrintDisclosures();
}

initializeApplication().catch(showFatalApplicationError);
