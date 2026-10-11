import { JSDOM } from "jsdom";
import { initializeDirectory } from "../src/site/scripts/render-directory.js";
export function renderStaticDirectory(html, content, publication) {
  const dom = new JSDOM(html, { url:"https://preview.invalid/" });
  globalThis.window=dom.window; globalThis.document=dom.window.document;
  initializeDirectory({siteConfig:{lastReviewed:content.election.lastReviewed,electionDay:content.election.dateDisplay,correctionEmail:content.guide.correctionEmail},interfaceCopy:content.interfaceCopy,affiliationGuide:content.affiliationGuide,electionData:publication.offices,categorySummaryData:publication.categorySummaries,renderOnly:true});
  let result=html.replace('<div class="directory-categories" id="directory-content"></div>', dom.window.document.querySelector("#directory-content").outerHTML);
  result=result.replace(/<ul class="directory-stats"[^>]*>[\s\S]*?<\/ul>/, dom.window.document.querySelector(".directory-stats").outerHTML);
  result=result.replace(/<p id="directory-status"[^>]*>[\s\S]*?<\/p>/, '<p id="directory-status" class="directory-status visually-hidden" role="status" aria-live="polite"></p>');dom.window.close();delete globalThis.window;delete globalThis.document;return result;
}
