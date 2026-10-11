import { execFileSync } from "node:child_process";
import { electionConfig, projectRoot, resolveProjectPath } from "./election-config.mjs";
// Source adapters own cycle-specific imports. Pre-normalized inputs need no adapter.
if (electionConfig.sourceAdapter) execFileSync(process.execPath, [resolveProjectPath(electionConfig.sourceAdapter), "--write"], { cwd: projectRoot, stdio: "inherit" });
execFileSync(process.execPath, ["scripts/build-site.mjs"], { cwd: projectRoot, stdio: "inherit" });
