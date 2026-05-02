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
