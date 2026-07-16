async function loadJson(url, label) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`${label} could not be loaded (${response.status}).`);
  return response.json();
}

export async function loadPublicationData() {
  const [content, directory] = await Promise.all([
    loadJson(new URL("../data/site-content.json", import.meta.url), "Site content"),
    loadJson(new URL("../data/election-directory-2026.json", import.meta.url), "Election directory")
  ]);

  if (!Array.isArray(directory.offices) || !Array.isArray(directory.categorySummaries)) {
    throw new Error("The published election directory has an invalid structure.");
  }

  return { content, directory };
}
