import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";
import { HtmlValidate } from "html-validate";
import { projectRoot, publicRoot, publicHtmlPath } from "./project-paths.mjs";
const require=createRequire(import.meta.url);
const validator=new HtmlValidate({extends:["html-validate:recommended"],rules:{"void-style":"off","attribute-empty-style":"off","attribute-boolean-style":"off"}});
const home=fs.readFileSync(publicHtmlPath,"utf8");
for(const slug of ["privacy","use-of-guide","accessibility"]) {
  assert.ok(home.includes(`href="${slug}.html"`),`Missing footer link ${slug}`);
  const html=fs.readFileSync(path.join(publicRoot,`${slug}.html`),"utf8");
  const validation=await validator.validateString(html);
  assert.ok(validation.valid,JSON.stringify(validation.results.flatMap(r=>r.messages)));
  const dom=new JSDOM(html,{runScripts:"outside-only"});
  dom.window.eval(fs.readFileSync(require.resolve("axe-core/axe.min.js"),"utf8"));
  const result=await dom.window.axe.run(dom.window.document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa","wcag22aa"]},rules:{"color-contrast":{enabled:false}}});
  assert.equal(result.violations.length,0,JSON.stringify(result.violations.map(v=>v.id)));
  assert.equal(dom.window.document.querySelectorAll("h1").length,1);
  for(const link of dom.window.document.querySelectorAll('a[href]')) {
    const href=link.getAttribute("href");
    if(!/^[a-z]+:/i.test(href)&&!href.startsWith('#')) assert.ok(fs.existsSync(path.join(publicRoot,href.split('#')[0])),`Broken disclosure link ${href}`);
  }
  dom.window.close();
}
console.log("All footer disclosure pages pass HTML, accessibility, and local-link checks.");
