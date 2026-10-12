import assert from "node:assert/strict";
import fs from "node:fs";
import { publicDirectoryPath, publicContentPath } from "./project-paths.mjs";
const directory=JSON.parse(fs.readFileSync(publicDirectoryPath,"utf8"));
const content=JSON.parse(fs.readFileSync(publicContentPath,"utf8"));
const config={electionId:directory.electionId,contractVersion:directory.contractVersion,directoryFile:"election-directory-2026.json"};
const requests=[];
const originalFetch=globalThis.fetch;
try {
  globalThis.fetch=async (url,options)=>{
    requests.push({url,options});
    assert.equal(url.searchParams.get("v"),"cache-test-1");
    assert.equal(options.cache,"no-cache");
    const value=url.pathname.endsWith("election-config.json")?config:url.pathname.endsWith("site-content.json")?content:directory;
    return {ok:true,json:async()=>value};
  };
  const {loadPublicationData}=await import(new URL("../src/site/scripts/data-loader.js?v=cache-test-1",import.meta.url));
  assert.deepEqual(await loadPublicationData(),{content,directory});
  assert.equal(requests.length,3);
  const incompatible={...directory,electionId:"different-election"};
  globalThis.fetch=async url=>({ok:true,json:async()=>url.pathname.endsWith("election-config.json")?config:url.pathname.endsWith("site-content.json")?content:incompatible});
  await assert.rejects(loadPublicationData,/identity mismatch/);
} finally { globalThis.fetch=originalFetch; }
console.log("All publication requests share the build version and reject mismatched election data.");
