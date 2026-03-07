# Breadcrumbs Component

## Overview

The Breadcrumbs component provides dynamic navigation breadcrumbs for the portal, automatically generating a breadcrumb trail based on the current URL path.

## Features

- **Automatic Path Detection**: Automatically generates breadcrumbs from the current URL
- **Smart Formatting**: Converts URL segments to readable labels
- **Home Icon**: Displays a home icon for the Dashboard link
- **Special Case Handling**: Recognizes common route patterns like "questionbank", "single-question", etc.
- **Dynamic Routes**: Handles action routes (add, edit, view) and ID parameters

## Usage

The component is integrated into the admin layout at `/src/routes/(admin)/+layout.svelte` and appears below the sidebar trigger.

## Path Formatting Rules

The breadcrumbs component applies the following formatting rules:

### Special Cases
- `questionbank` → "Question Bank"
- `single-question` → "Question"
- `test-template` → "Test Template"
- `test-session` → "Test Session"
- `test-practice` → "Practice Test"
- `test-assessment` → "Assessment Test"
- `password` → "Change Password"

### Actions
- `add` → "Add"
- `edit` → "Edit"
- `view` → "View"
- `import` → "Import"

### Default Formatting
For other path segments, the component:
1. Splits on hyphens
2. Capitalizes the first letter of each word
3. Joins with spaces

Example: `test-results` → "Test Results"

## Example Breadcrumb Trails

| URL | Breadcrumb Trail |
|-----|-----------------|
| `/dashboard` | _No breadcrumbs shown_ |
| `/questionbank` | Dashboard > Question Bank |
| `/questionbank/import` | Dashboard > Question Bank > Import |
| `/questionbank/single-question/add/123` | Dashboard > Question Bank > Question > Add > 123 |
| `/users` | Dashboard > Users |
| `/users/edit/456` | Dashboard > Users > Edit > 456 |
| `/profile/password` | Dashboard > Profile > Change Password |

## Implementation Details

The component:
- Uses the `$page.url.pathname` from `$app/state` to get the current route
- Parses the pathname into segments
- Always starts with a "Dashboard" breadcrumb (linking to `/dashboard`)
- Skips the "dashboard" segment to avoid duplication
- Renders using the pre-built breadcrumb UI components from `/src/lib/components/ui/breadcrumb`

## Testing

Unit tests are located in `/src/lib/components/Breadcrumbs.svelte.test.ts` and cover:
- Basic rendering
- Component instantiation

## UI Components Used

The component uses the following UI components (from bits-ui):
- `Breadcrumb.Root` - Container
- `Breadcrumb.List` - List wrapper
- `Breadcrumb.Item` - Individual breadcrumb
- `Breadcrumb.Link` - Clickable breadcrumb links
- `Breadcrumb.Page` - Current page (non-clickable)
- `Breadcrumb.Separator` - Visual separator (chevron icon)

## Styling

The breadcrumbs inherit styling from the UI component library and Tailwind CSS configuration. The home icon uses Lucide icons (`@lucide/svelte`).
