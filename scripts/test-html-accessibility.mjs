import { initializeDirectory } from "../src/site/scripts/render-directory.js";
import { publicContentPath, publicDirectoryPath } from "./project-paths.mjs";
import fs from "node:fs";
import { HtmlValidate } from "html-validate";
import { JSDOM } from "jsdom";
import { createRequire } from "node:module";
import { publicHtmlPath } from "./project-paths.mjs";
const html=fs.readFileSync(publicHtmlPath,"utf8");
const validator=new HtmlValidate({extends:["html-validate:recommended"],rules:{"attribute-empty-style":"off","attribute-boolean-style":"off","prefer-native-element":"off","void-style":"off","no-trailing-whitespace":"off","attr-quotes":"off","doctype-style":"off"}});
const report=await validator.validateString(html);
if(!report.valid){console.log(JSON.stringify(report.results.flatMap(r=>r.messages),null,2));throw new Error("HTML validation failed");}
const dom=new JSDOM(html,{runScripts:"outside-only",url:"https://preview.invalid/"});
globalThis.window=dom.window;globalThis.document=dom.window.document;
const content=JSON.parse(fs.readFileSync(publicContentPath,"utf8"));const publication=JSON.parse(fs.readFileSync(publicDirectoryPath,"utf8"));
initializeDirectory({siteConfig:{lastReviewed:content.election.lastReviewed,electionDay:content.election.dateDisplay,correctionEmail:content.guide.correctionEmail},interfaceCopy:content.interfaceCopy,affiliationGuide:content.affiliationGuide,electionData:publication.offices,categorySummaryData:publication.categorySummaries});
const liveReport=await validator.validateString(dom.serialize());if(!liveReport.valid){console.log(JSON.stringify(liveReport.results.flatMap(r=>r.messages),null,2));throw new Error("Interactive HTML validation failed");}
dom.window.document.querySelectorAll("details").forEach(d=>d.open=true);
dom.window.document.querySelector("#affiliation-guide").hidden=false;
const require=createRequire(import.meta.url);
dom.window.eval(fs.readFileSync(require.resolve("axe-core/axe.min.js"),"utf8"));
const results=await dom.window.axe.run(dom.window.document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa","wcag22aa"]},rules:{"color-contrast":{enabled:false}}});
if(results.violations.length){console.log(JSON.stringify(results.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),null,2));throw new Error("Rendered accessibility check failed");}
dom.window.close();delete globalThis.window;delete globalThis.document;console.log("HTML and expanded-directory axe checks passed. Layout, color contrast and screen readers need browser/manual checks.");
