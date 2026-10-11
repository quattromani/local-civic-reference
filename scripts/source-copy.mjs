import fs from "node:fs";
import { electionConfig, resolveProjectPath } from "./election-config.mjs";
export const sourceCopy = JSON.parse(fs.readFileSync(resolveProjectPath(electionConfig.sourceCopy), "utf8"));
