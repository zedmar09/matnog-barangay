# Household and Structures Dashboard Design

## Goal

Redesign the A2 Household Registry landing view as a visual operational dashboard for barangay staff. The page must summarize households, household members, structures, housing conditions, access to basic services, priority needs, and record freshness using plain language.

## Scope

- Replace the existing text header with a photographic hero banner using `household.jpeg`.
- Remove the `A2 Household Registry` label.
- Keep `Households & Structures` as the page title and show the active barangay scope.
- Add `Register Household` and `Export Report` actions to the hero.
- Replace the current four-card summary with five connected metrics.
- Add visual summaries for barangay distribution, priority needs, housing conditions, and basic services.
- Preserve the barangay inventory and priority household sections with clearer wording.
- Use only the existing household, structure, resident, and barangay data stores.

## Layout

### Hero

The hero follows the established Resident Dashboard structure: a dark green image overlay, title and scope on the left, and actions on the right. The source image is copied from `/Users/edmarsanchez/Downloads/household.jpeg` to `public/images/household.jpeg`.

### Summary metrics

Five cards appear over the lower edge of the hero:

1. Total Households
2. Household Members
3. Mapped Structures
4. Average Household Size
5. Records Needing Update

All values reflect the barangays selected in the global barangay switcher.

### Visual summaries

- **Households by Barangay:** a horizontal bar chart. For all-barangay scope, show the leading barangays so labels remain readable. For a narrower scope, show every selected barangay with household data.
- **Household Priority Overview:** a donut chart separating records into `No priority concern`, `Priority support needed`, and `Record needs updating`. A household needing an update is counted once in the update segment; otherwise, a household with at least one vulnerability indicator is counted in the support segment.
- **Housing Conditions:** two compact donut charts showing construction material and tenure.
- **Access to Basic Services:** horizontal progress rows for safe toilet access, regular electricity, improved water access, regular waste collection, and internet access. Each row shows both the count and percentage of mapped structures.

### Barangay household inventory

The table remains the detailed operational summary. Its columns are:

- Barangay
- Households
- Residents
- Structures
- Households Needing Support
- Records to Update
- Data Status

The status values are `Records up to date` when no household record needs updating and `<count> records to update` otherwise.

### Priority households

The priority list links to the existing household profile. Each row shows the household number, household head, and a plain-language reason:

- `Update household record` when verification is out of date.
- `<count> priority need` or `<count> priority needs` when vulnerability indicators are present.

The list sorts records needing updates first and then by number of priority needs.

## Data behavior

The dashboard derives every visualization from the existing Zustand stores. It uses the global `isAllSelected` and `selectedBarangays` scope so multi-barangay selection works consistently with the Resident Dashboard. Empty scopes display zero values and empty visual states without errors.

The Export Report action downloads a CSV containing the visible barangay inventory rows. It uses the active scope and a date-stamped filename. No server endpoint is required for this UI phase.

## Components and styling

The dashboard remains one feature view and receives a dedicated CSS module so household changes do not alter the Resident Dashboard or shared registry pages. Recharts, Lucide icons, existing typography, borders, colors, spacing, and responsive behavior match the current production UI.

On smaller screens, action buttons wrap, metric cards reduce columns, chart panels become a single column, and the inventory remains horizontally scrollable.

## Verification

- Run TypeScript checking.
- Run the production build.
- Open `/barangay-affairs/households` and inspect the all-barangay view.
- Change the global barangay selection and confirm every metric, chart, list, and export row follows the scope.
- Confirm the hero image loads, the old A2 label is absent, priority labels use plain language, and the page remains usable at mobile width.

