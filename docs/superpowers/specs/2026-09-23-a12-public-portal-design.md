# A12 Public Portal Design

## Purpose

A12 provides a no-login public surface for municipal and barangay information. It uses the existing MATNOG BRGYS visual language while remaining separate from the internal staff workspace and its sidebar.

The portal contains no resident, household, sectoral, assistance-recipient, peace-and-order, audit-log, or other sensitive personal records.

## Delivery phases

### Phase 1: Public portal foundation

- Replace the empty root page at `/` with the public landing page.
- Add a dedicated responsive public header and footer.
- Add navigation for Home, Barangays, Officials, Transparency, Projects, Document Verification, and Feedback.
- Add a public barangay selector with All Barangays plus the 40 Matnog barangays.
- Add a Staff Portal action that enters the existing internal workspace.
- Show municipality-wide summary information when All Barangays is selected.
- Change the page identity and visible summaries to the chosen barangay when a specific barangay is selected.

### Phase 2: Barangays and officials

- Add the 40-barangay directory and individual barangay profiles.
- Add the public officials directory, roles, terms, and public office contact information.
- Filter directory content using the shared barangay selection.

### Phase 3: Transparency

- Publish budgets, financial statements, procurement notices, awards, and fund-utilization summaries.
- Support fiscal-year, document-type, and barangay filters.
- Expose downloadable public documents only.

### Phase 4: Public projects

- Add a project directory with budget, contractor, status, completion percentage, and approved public photos.
- Support project type, status, fiscal year, and barangay filters.
- Add project detail pages and a public project-feedback entry point.

### Phase 5: Verification and feedback

- Add public document verification using a QR token or reference number.
- Return document status and safe public metadata only.
- Add public feedback submission and reference tracking.
- Automatically associate feedback with the currently selected barangay while allowing the sender to change it before submission.

## Route architecture

| Route | Purpose |
| --- | --- |
| `/` | Public portal home |
| `/public/barangays` | Barangay directory |
| `/public/barangays/[code]` | Barangay profile |
| `/public/officials` | Officials directory |
| `/public/transparency` | Transparency library and summaries |
| `/public/projects` | Public project directory |
| `/public/projects/[id]` | Public project details |
| `/public/verify` | Document verification entry |
| `/public/feedback` | Feedback submission and tracking |
| `/barangay-affairs/*` | Existing authenticated staff workspace |

The existing `/verify/document/[token]` route remains compatible with QR links. The public verification entry may resolve into this route where appropriate.

## Application shells

The root layout continues to provide Poppins and global styling. The existing `AppShell` detects public routes and renders their children without the staff header and sidebar. Public routes use a dedicated `PublicPortalShell` with:

- MATNOG BRGYS identity
- Horizontal public navigation
- Global barangay selector
- Accessible mobile navigation
- Staff Portal action
- Public footer with municipal contact and quick links

This keeps staff-only controls out of public pages and avoids duplicating the global font and base styles.

## Barangay-aware behavior

The existing barangay scope provider is extended for public use. The selection supports:

- `all`: title displays Municipality of Matnog or All Barangays and content is aggregated.
- Specific barangay code: title displays `Brgy. {Barangay Name}` and eligible content is filtered to that barangay.

The selection persists while navigating between public pages and during browser reloads. Public content derives its filter from this single shared scope. Document verification remains municipality-wide because a valid document may originate from any barangay. Feedback uses the selected barangay as its initial destination.

## Phase 1 landing-page composition

1. Public announcement strip for current municipal notices.
2. Responsive public header with navigation, barangay selector, and Staff Portal action.
3. Civic hero with selected-scope title, introductory copy, and primary actions for projects and document verification.
4. Public summary cards for barangays, current projects, published notices, and service availability.
5. Quick-service cards for Barangays, Officials, Transparency, Projects, Verification, and Feedback.
6. Featured public notices and active projects using safe dummy data.
7. Public footer with municipal office details, navigation, and privacy statement.

## Data model and flow

Phase 1 uses typed local dummy data and the existing 40-barangay source. Later phases can replace the local repositories with API adapters without changing view contracts.

1. The selector updates the shared barangay scope.
2. Public view selectors compute the applicable totals, notices, officials, and projects.
3. Components receive already-filtered public view models.
4. Empty results show a clear public empty state rather than falling back to another barangay.

Only fields explicitly included in public view models may be rendered in the public portal.

## Visual direction

- Continue Poppins and the existing restrained Matnog green palette.
- Use white cards, subtle borders, light neutral backgrounds, and semantic status colors.
- Give the public portal more open spacing than the internal staff workspace.
- Avoid gradients and decorative effects that conflict with the existing application.
- Use responsive cards and stacked navigation on narrow screens.

## Accessibility and responsive behavior

- Keyboard-accessible navigation and selector controls.
- Visible focus states and sufficient text contrast.
- Descriptive labels for icons and menu controls.
- Mobile navigation opens as a simple menu or drawer.
- Content remains readable at 320px width without horizontal page overflow.
- Reduced-motion preferences are respected for menu transitions.

## Privacy and security boundaries

- Public pages do not import resident, household, sectoral, assistance, peace-and-order, or audit datasets.
- Public project and financial records use dedicated public projections.
- Verification returns status and safe document metadata only.
- Feedback forms collect only the fields required for routing and follow-up.
- UI filtering is not treated as authorization; future APIs must enforce public projections server-side.

## Validation

Each phase must pass:

- Biome checks
- TypeScript checking
- Next.js production build
- Browser verification of desktop and narrow layouts
- Keyboard navigation checks for public menus and selectors
- Barangay-scope checks for All Barangays and at least two specific barangays
- A privacy review confirming that no internal data fields appear in page output

Phase 1 is complete when the public landing page, navigation, persistent barangay selection, responsive behavior, and Staff Portal entry work in the browser without changing the internal staff workspace.
