import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { projectRoot } from "./project-paths.mjs";

const hashTree = (directory) => {
  const hash = crypto.createHash("sha256");
  const files = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else files.push(fullPath);
    }
  };
  visit(directory);
  for (const file of files) {
    hash.update(path.relative(directory, file));
    hash.update(fs.readFileSync(file));
  }
  return { sha256: hash.digest("hex"), files: files.length };
};

execFileSync(process.execPath, ["scripts/build-site.mjs"], { cwd: projectRoot, stdio: "ignore" });
const first = hashTree(path.join(projectRoot, "public"));
execFileSync(process.execPath, ["scripts/build-site.mjs"], { cwd: projectRoot, stdio: "ignore" });
const second = hashTree(path.join(projectRoot, "public"));
if (first.sha256 !== second.sha256) throw new Error(`Public build is not deterministic: ${first.sha256} != ${second.sha256}`);
process.stdout.write(`${JSON.stringify({ valid: true, ...second }, null, 2)}\n`);
