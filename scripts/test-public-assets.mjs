import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { publicRoot, publicHtmlPath } from "./project-paths.mjs";
const dom = new JSDOM(fs.readFileSync(publicHtmlPath,"utf8"));
const references = [];
for (const element of dom.window.document.querySelectorAll("[href],[src],[srcset]")) {
  for (const attribute of ["href","src"]) if (element.hasAttribute(attribute)) references.push(element.getAttribute(attribute));
  if (element.hasAttribute("srcset")) references.push(...element.getAttribute("srcset").split(",").map(part=>part.trim().split(/\s+/)[0]));
}
for (const reference of references) {
  if (reference.startsWith("#")) assert.ok(dom.window.document.getElementById(reference.slice(1)),`Missing anchor ${reference}`);
  else if (!/^[a-z]+:/i.test(reference)) {
    const file = path.resolve(publicRoot,reference.split(/[?#]/)[0]);
    assert.ok(file.startsWith(publicRoot+path.sep),`Asset leaves publication ${reference}`);
    assert.ok(fs.existsSync(file),`Missing local asset ${reference}`);
  }
}
const cssRoot=path.join(publicRoot,"styles");
for (const file of fs.readdirSync(cssRoot).filter(file=>file.endsWith(".css"))) {
  const css=fs.readFileSync(path.join(cssRoot,file),"utf8");
  for(const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    const reference=match[1];if(/^[a-z]+:/i.test(reference)) continue;
    assert.ok(fs.existsSync(path.resolve(cssRoot,reference.split("?")[0])),`Missing CSS asset ${reference}`);
  }
}
assert.ok(!fs.existsSync(path.join(publicRoot,"assets/fixture-header.svg")),"Fixture artwork leaked into active publication");
dom.window.close();console.log("Published local assets, internal anchors, and fixture separation passed.");
