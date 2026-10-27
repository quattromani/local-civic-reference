import { renderJudicialRetention } from "./judicial-retention.js?v=68f74b63b228";
import { setupNavigation } from "./navigation.js?v=68f74b63b228";
import { setupPrintDisclosures, showFatalApplicationError } from "./accessibility.js?v=68f74b63b228";
import { loadPublicationData } from "./data-loader.js?v=68f74b63b228";
import { setupDirectoryLinks } from "./directory-links.js?v=68f74b63b228";
import { initializeDirectory } from "./render-directory.js?v=68f74b63b228";

setupNavigation();

async function initializeApplication() {
  const { content, directory } = await loadPublicationData();
  const siteConfig = {
    lastReviewed: content.election.lastReviewed,
    electionDay: content.election.dateDisplay,
    correctionEmail: content.guide.correctionEmail
  };

  renderJudicialRetention(directory.judicialRetention, content.judicialRetention);
  initializeDirectory({
    siteConfig,
    interfaceCopy: content.interfaceCopy,
    affiliationGuide: content.affiliationGuide,
    electionData: directory.offices,
    categorySummaryData: directory.categorySummaries
  });
  setupDirectoryLinks();
  setupPrintDisclosures();
}

initializeApplication().catch(showFatalApplicationError);
