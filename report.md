# Report: Company Leaderboard — Implementation Write-up

## Approach

The task was to replicate a company leaderboard UI from a set of design screenshots, using only static web technologies suitable for GitHub Pages hosting. The solution had to match the original pixel-for-pixel — all UI elements, filters, sorting, responsive layout — but contain zero real data from the original.

I started by analysing all provided design images (desktop and ≤768px mobile views) to understand the full UI surface: page layout, the podium for top-3 performers, the scrollable ranked list with expandable rows, the filter bar with custom dropdowns and a search field, and the activity detail table.

From that analysis I produced a written plan covering file structure, data schema, CSS architecture, and JS logic before writing any code. The implementation then proceeded phase by phase — data, HTML, CSS, JS — with each phase reviewed before moving to the next. Visual fidelity was verified iteratively using Chrome DevTools MCP to take screenshots and compare them against the design images.

## Tools and Techniques

- **GitHub Copilot (VS Code)** — used throughout for planning, code generation, and incremental refinement
- **Chrome DevTools MCP** — automated browser screenshots, DOM inspection, and computed style extraction to compare the deployed site against design images and catch visual discrepancies
- **Pure HTML5 + CSS3 + Vanilla JS** — no framework, no build tools; the entire app is a set of static files
- **BEM methodology** — CSS follows Block-Element-Modifier naming for maintainability and clarity
- **Font Awesome 6 (CDN)** — icon library for category icons (graduation cap, monitor display, smiley face), star ratings, and UI chrome (chevrons, magnifying glass)
- **pravatar.cc (CDN)** — deterministic avatar placeholder images for mock people who "have" profile photos
- **GitHub Actions** — automated deployment to GitHub Pages on every push to `main`

## Data Replacement Strategy

No real data from the original leaderboard was ever provided to the AI assistant or included in the codebase. Before taking any design reference screenshots, I used a browser console script to replace all real names, titles, and other sensitive text visible on the original page, ensuring the AI never had access to real employee data. The design screenshots used for reference only contained anonymised placeholder text.

All data in the solution is fully invented:

- **Names** — international mix of first and last names, none derived from the original
- **Job titles** — plausible engineering/tech titles (Principal Software Engineer, Lead Data Engineer, etc.) that fit a tech company leaderboard context
- **Department codes** — invented hierarchical codes following the pattern `{CC}.U{n}.D{n}.G{n}` (e.g. `WA.U1.D2.G3`), which visually match the style of the original without containing any real organisational data
- **Activity names** — follow the same bracketed prefix patterns visible in the design (`[LAB]`, `[UNI]`, `[TALK]`) but with fictional topics, university names, and event names
- **Point values** — distributed across the documented ranges per category (Education: 16/32/64/96; University Partnership: 16/32; Public Speaking: 8/16/32/64) to produce a plausible leaderboard score spread

The ~40 mock people are spread across all four quarters of 2025, with a mix of one, two, or three active categories per person, and a score distribution from ~560 points at the top to ~16 points at the tail — matching the proportions visible in the original design.

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| No framework | Keeps the project zero-dependency; works directly on GitHub Pages without a build step |
| Custom div-based dropdowns | Allows full CSS control over appearance, matching the design; native `<select>` elements cannot be reliably styled cross-browser |
| Filter engine re-computes everything on each change | Keeps logic simple and correct; at ~40 records the performance cost is negligible |
| Top-3 podium updates with filters | Matches the spec: filtered results change who appears on the podium |
| Initials avatar fallback | Deterministic color from name hash ensures the same person always gets the same color; no external dependency |
| Activity dates stored as ISO strings | Formatting to DD-MMM-YYYY is done in JS at render time, keeping the JSON clean |

## Iterative Visual Fixes — What Helped

After the initial implementation, a significant portion of work went into closing the gap between the generated UI and the design. The process that made this efficient was a tight feedback loop between visual comparison tools and targeted edits.

### What drove each fix

**Chrome DevTools MCP** was the primary debugging tool. It allowed the AI to:
- Take screenshots of the live/local site without manual intervention
- Execute JavaScript in the browser console to evaluate computed styles (`window.getComputedStyle`) and compare exact colour values, border widths, and spacing against the design
- Simulate viewport widths (e.g. setting `meta[name=viewport]` to `width=768`) to test responsive layouts without resizing the browser window

**Side-by-side image comparison** — design screenshots were stored in `/images/` and the MCP-captured live screenshots were saved alongside them. Viewing both images in the same turn let the AI spot pixel-level differences (e.g. wrong border thickness, slightly off background colour) that text descriptions alone would miss.

**User feedback as a diff** — the user reviewed each round of fixes and described remaining discrepancies precisely (e.g. "2nd and 3rd place circles are both silver", "filters have less rounded borders"). Each piece of feedback was treated as a specific, testable requirement, which prevented unnecessary changes to parts that were already correct.

**Computed style extraction** — for colour and typography discrepancies, the user provided exact browser-computed style values from the original page (e.g. `color: rgb(30, 41, 59)`, `font-weight: 600`, `padding: 16px 8px`). Feeding those values directly into the CSS removed guesswork and resolved the activity table row styles in one pass.

### Recurring mistake patterns identified

- **Over-rounding borders** — initial border-radius values (8–12px) were too large for filter controls; the design uses ~3px, giving a nearly square look
- **Left-border persistence** — a decorative wider left border was added to person cards early on and took several rounds to fully remove from all states (normal, top-3, expanded) because different CSS rules were overriding each other
- **Podium avatar ring colours** — gold/silver/bronze ring colours were initially taken from accent colour variables rather than the podium background colours, so the rings clashed with the platform
- **Search re-populating the podium** — the initial implementation took `visible.slice(0, 3)` after filtering, which replaced podium entries with whoever ranked highest in the search results; the fix was to filter by original rank (`rank <= 3`) instead, and to map podium slots by rank rather than array index so partial results render in the correct position
- **Browser caching during local development** — the Python `http.server` returns `304 Not Modified` for unchanged files, causing the browser to silently serve stale JS/CSS after edits. This was resolved by switching to a no-cache server (`Cache-Control: no-store`) and adding a version query string to the script tag when needed
