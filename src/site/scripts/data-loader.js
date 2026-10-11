async function loadJson(url, label) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`${label} could not be loaded (${response.status}).`);
  return response.json();
}

export async function loadPublicationData() {
  const config = await loadJson(new URL("../data/election-config.json", import.meta.url), "Election configuration");
  if (config.contractVersion !== "1.0.0" || !/^[a-z0-9-]+\.json$/.test(config.directoryFile)) throw new Error("Unsupported published election contract");
  const [content, directory] = await Promise.all([
    loadJson(new URL("../data/site-content.json", import.meta.url), "Site content"),
    loadJson(new URL(`../data/${config.directoryFile}`, import.meta.url), "Election directory")
  ]);

  if (directory.electionId !== config.electionId || directory.contractVersion !== config.contractVersion) throw new Error("Election publication identity mismatch");
  if (!Array.isArray(directory.offices) || !Array.isArray(directory.categorySummaries)) {
    throw new Error("The published election directory has an invalid structure.");
  }

  return { content, directory };
}
