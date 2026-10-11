import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { projectRoot } from "./project-paths.mjs";
const source = fs.readFileSync(path.join(projectRoot,"src/site/scripts/analytics.js"),"utf8");
function run(hostname, hasTag=true) {
  const inserted=[], handlers={};
  let pending;
  const context={window:{setTimeout:fn=>{pending=fn;return 1;},clearTimeout:()=>{pending=null;}},location:{hostname,origin:`https://${hostname}`,pathname:"/",hash:"#candidate-name",search:"?private=value"},document:{addEventListener:(type,fn)=>handlers[type]=fn,referrer:"https://referrer.test/path?private=value",querySelector:selector=>selector.includes("data-directory-office-count")?{textContent:"0"}:hasTag?{dataset:{measurementId:"G-D28Q74TJYD",allowedHost:"partyreveal.com"}}:null,createElement:()=>({}),head:{appendChild:s=>inserted.push(s)}},URL,Date};
  vm.runInNewContext(source,context);
  return {context,inserted,handlers,flush:()=>pending?.()};
}
for(const host of ["localhost","127.0.0.1","::1","preview.test"]) {
  const {context,inserted}=run(host);assert.equal(inserted.length,0);assert.equal(context.window.dataLayer,undefined);
}
assert.equal(run("partyreveal.com",false).inserted.length,0);
const {context,inserted,handlers,flush}=run("partyreveal.com");
assert.equal(inserted.length,1);assert.equal(inserted[0].src,"https://www.googletagmanager.com/gtag/js?id=G-D28Q74TJYD");assert.equal(inserted[0].async,true);
const calls=context.window.dataLayer.map(args=>Array.from(args));
assert.equal(calls.length,2);assert.equal(calls[1][0],"config");assert.equal(calls[1][1],"G-D28Q74TJYD");assert.equal(calls[1][2].page_location,"https://partyreveal.com/");assert.equal(calls[1][2].page_referrer,"https://referrer.test");assert.equal(calls[1][2].allow_google_signals,false);
const html=fs.readFileSync(path.join(projectRoot,"public/index.html"),"utf8");assert.equal((html.match(/data-measurement-id="G-D28Q74TJYD"/g)||[]).length,1);
const fixture=fs.readFileSync(path.join(projectRoot,"work/fixture-public/index.html"),"utf8");assert.doesNotMatch(fixture,/data-measurement-id/);
console.log("GA4 initialization, safe page metadata, and preview exclusion passed.");

handlers.input({target:{id:"directory-search",value:"A sensitive candidate search"}});flush();
const events=context.window.dataLayer.map(args=>Array.from(args)).filter(args=>args[0]==="event");
assert.equal(events[0][1],"directory_search_used");assert.equal(events[0][2].result_state,"none");assert.equal(events[1][1],"directory_search_no_results");
handlers.click({target:{closest:()=>({matches:selector=>selector===".source-link"})}});
assert.equal(Array.from(context.window.dataLayer.at(-1))[1],"source_opened");
assert.doesNotMatch(JSON.stringify(context.window.dataLayer.map(args=>Array.from(args))),/sensitive|candidate-name|private=value/);
