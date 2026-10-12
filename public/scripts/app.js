import { setupNavigation } from "./navigation.js?v=f274351ba5ee";
import { setupPrintDisclosures, showFatalApplicationError } from "./accessibility.js?v=f274351ba5ee";
import { loadPublicationData } from "./data-loader.js?v=f274351ba5ee";
import { setupDirectoryLinks } from "./directory-links.js?v=f274351ba5ee";
import { initializeDirectory } from "./render-directory.js?v=f274351ba5ee";

setupNavigation();

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
    affiliationGuide: content.affiliationGuide,
    electionData: directory.offices,
    categorySummaryData: directory.categorySummaries
  });
  setupDirectoryLinks();
  setupPrintDisclosures();
}

initializeApplication().catch(showFatalApplicationError);
