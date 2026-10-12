import { JSDOM } from "jsdom";
import { initializeDirectory } from "../src/site/scripts/render-directory.js";

export function renderStaticDirectory(html, content, publication) {
  const dom = new JSDOM(html, { url: "https://preview.invalid/" });
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  try {
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    initializeDirectory({
      siteConfig: {
        lastReviewed: content.election.lastReviewed,
        electionDay: content.election.dateDisplay,
        correctionEmail: content.guide.correctionEmail
      },
      interfaceCopy: content.interfaceCopy,
      affiliationGuide: content.affiliationGuide,
      electionData: publication.offices,
      categorySummaryData: publication.categorySummaries,
      renderOnly: true
    });
    const directory = dom.window.document.querySelector("#directory-content");
    if (publication.offices.length && !directory.childElementCount) {
      throw new Error("Static directory rendering failed; refusing an incomplete publication.");
    }
    let result = html.replace(
      '<div class="directory-categories" id="directory-content"></div>',
      directory.outerHTML
    );
    result = result.replace(
      /<ul class="directory-stats"[^>]*>[\s\S]*?<\/ul>/,
      dom.window.document.querySelector(".directory-stats").outerHTML
    );
    return result.replace(
      /<p id="directory-status"[^>]*>[\s\S]*?<\/p>/,
      '<p id="directory-status" class="directory-status visually-hidden" role="status" aria-live="polite"></p>'
    );
  } finally {
    dom.window.close();
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
}
