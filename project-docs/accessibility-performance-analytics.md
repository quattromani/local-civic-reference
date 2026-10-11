# Accessibility, performance, and analytics

The build now renders the directory into the initial HTML using the same candidate renderer as the browser. Race drawers and cited sources remain available without JavaScript. Search is initially disabled and unlocks when the application initializes. The no-script notice explains how to browse. The browser still loads normalized JSON to support search and filtering.

HTML validation runs against both the generated page and the initialized interactive DOM. The axe-core check scans the initialized directory with drawers expanded, including affiliation controls. The existing contrast and accessibility safeguards remain. The HTML validator permits equivalent boolean-attribute serialization and the custom search combobox/listbox; structural content and ARIA validity remain checked.

Candidate headings use level five for current candidates and level six beneath primary-history headings. Heading IDs include the office and stage. Summary headings contain their phrasing elements directly, avoiding headings nested inside spans. Display styles preserve the existing layout and typography.

The ballot photograph has 800, 1400, and 2172 pixel WebP variants with JPEG fallback. Directory JSON is compacted only in the generated public output; canonical source JSON stays readable. Initial HTML is larger because candidates and evidence are available before JavaScript. Transport compression depends on hosting and is not asserted by the local build.

GA4 emits category_opened, race_opened, sources_expanded, source_opened, calendar_download_clicked, affiliation_filter_used, nonpartisan_filter_used, directory_search_used, and directory_search_no_results. Search events wait for a one-second pause and report only matches or none. Counts of matching offices establish whether results exist, including primary-history-only results. Events carry no search text, names, party choices, source URLs, or visitor IDs added by the project. Standard GA4 itself retains its usual analytics-cookie behavior. Local and fixture previews do not initialize GA4.

The build and validation tools require Node 22.22.2, 24.15.0, or 26 and later compatible versions. Install the locked development dependencies with npm ci. The production application remains framework-free; validation and image tools are build dependencies only.

Checks do not establish ADA legal compliance or complete WCAG conformance. The DOM accessibility scanner cannot evaluate rendered contrast or geometry. Full screen-reader testing, zoom/text-spacing testing, touch target review, forced colors, and a browser-based contrast audit remain separate checks. A mobile reflow check and keyboard search check were performed locally.
