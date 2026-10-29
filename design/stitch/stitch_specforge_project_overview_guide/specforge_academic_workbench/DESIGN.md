---
name: SpecForge Academic Workbench
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#00190e'
  on-tertiary: '#ffffff'
  tertiary-container: '#00301f'
  on-tertiary-container: '#24a375'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  mono-data:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system serves an institutional-grade academic curriculum workbench engineered for instructional designers, accreditation reviewers, and university department chairs. The brand demeanor is authoritative, meticulous, and systematically clear. It rejects decorative excess in favor of information density, computational clarity, and cognitive ease during prolonged, multi-hour syllabus and competency modeling sessions.

The aesthetic fuses **Corporate / Modern** precision with high-density data architecture:
- **Tone:** Methodical, institutional, rigorous, and calm.
- **Visual Rhythm:** Structured data grids, explicit visual grouping, compact vertical cadences, and unambiguous status reporting.
- **Perception:** Inspires trust in regulatory compliance, ABET/curriculum accreditation standards, and pedagogical precision.

## Colors

The palette establishes a high-clarity workbench environment with high text-to-background contrast ratios exceeding WCAG AAA for core interactions:

- **Primary (`#1E293B` - Deep Slate Navy):** The structural anchor. Applied to mastheads, persistent navigation shells, primary command buttons, and definitive hierarchy markers.
- **Secondary (`#2563EB` - Tech Blue):** The interactive driver. Denotes actionable links, active selection states, focused input borders, and primary progress flows.
- **Tertiary (`#059669` - Academic Emerald):** The compliance and validation signal. Applied to verified learning outcomes, accreditation status passes, and audit approvals.
- **Neutral (`#64748B` - Slate Neutral):** The semantic bridge. Deployed across secondary labels, metadata tags, passive borders, and table dividing rules.

### Surface Tones & Tokens
- **Background Canvas:** `#F8FAFC` provides a calm, glare-resistant base for dense documentation.
- **Card / Surface Container:** `#FFFFFF` with razor-thin structural outlines.
- **Muted Sub-surfaces:** `#F1F5F9` for table headers, inactive segmented panels, and metadata code blocks.

## Typography

Typography relies entirely on the mechanical rigor and optical neutrality of Inter. Text is formatted for scannability, tabular data alignments, and structural curriculum hierarchy.

- **Headings:** Tightly tracked with solid negative letter spacing (`-0.02em` to `-0.01em`) to maintain an authoritative, compact footprint inside sidebars and panel headers.
- **Body:** Standardized at `14px` (`body-md`) for workbench interfaces to maximize viewport utilization without inducing eye strain.
- **Labels & Tags:** Employs uppercase or elevated medium weights (`label-sm`, `11px`, `0.04em` tracking) for course codes, credit loads, and Bloom's taxonomy tags.
- **Tabular Figures:** All numeric displays (course codes, contact hours, credit units) must implement `font-variant-numeric: tabular-nums` for precise vertical scanning across curriculum tables.

## Layout & Spacing

The workbench layout uses a dense, responsive fluid grid framework calibrated for information manipulation across multi-pane editing workflows:

- **Desktop (1280px+):** Three-pane operational view: Collapsible navigation/course catalog tree (260px fixed), primary curriculum builder canvas (fluid flex-grow), and contextual properties/validation inspector (320px fixed).
- **Tablet (768px - 1279px):** Two-pane layout with the properties inspector transforming into a sliding overlay drawer.
- **Mobile (<768px):** Single-column stacked mode with persistent bottom-pinned action bars for status checks and validation commits.

Spacing uses a strict 4px sub-grid with an emphasis on compact boundaries: `space-sm` (`8px`) and `space-md` (`12px`) dominate form groupings and tree nodes to limit scrolling while managing deep recursive module hierarchies.

## Elevation & Depth

The design system minimizes ambient light diffusion in favor of **low-contrast outlines** and structured tonal surfaces to reflect an analytical drafting instrument rather than a consumer interface:

- **Level 0 (Base Canvas):** `#F8FAFC`, flat.
- **Level 1 (Workbench Surfaces / Cards):** `#FFFFFF` paired with a single-pixel structural border (`1px solid #E2E8F0`). Elevation is communicated through border contrast rather than drop shadow.
- **Level 2 (Popovers, Select Menus, Dropdowns):** `#FFFFFF`, `1px solid #CBD5E1`, with a surgical shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modal Dialogs & Validation Sheets):** `#FFFFFF`, `1px solid #94A3B8`, with ambient containment: `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`.
- **Active / Dragging Module State:** Ghosted blue outline (`1px solid #2563EB`) with a subtle elevated lift: `0 8px 16px -4px rgba(37, 99, 235, 0.15)`.

## Shapes

The design system implements a **Soft (Level 1)** rounding paradigm. This deliberate choice enforces an architectural, blueprint feel appropriate for formal institutional curricula:

- **Base Radius (0.25rem / 4px):** Applied to buttons, inputs, segmented control segments, badges, and table cells.
- **Container Radius (`rounded-lg`, 0.5rem / 8px):** Applied to curriculum module cards, inspector panels, and modal containers.
- **Nested Inner Geometry:** Any nested component must preserve a smaller radius than its parent container to avoid geometric collisions (e.g., 4px badge inside an 8px card container).

## Components

### Buttons
- **Primary:** Background `#1E293B`, text `#FFFFFF`, radius `4px`, height `36px` (compact workbench size). Hover state transitions to `#334155`.
- **Action / Interactive:** Background `#2563EB`, text `#FFFFFF`. Hover state `#1D4ED8`. Focus: `2px` offset ring in `#2563EB`.
- **Secondary / Outline:** Background `#FFFFFF`, border `1px solid #CBD5E1`, text `#1E293B`. Hover state `#F8FAFC` with border `#94A3B8`.
- **Destructive:** Background `#FFFFFF`, border `1px solid #FCA5A5`, text `#DC2626`. Hover state `#FEF2F2`.

### Segmented Controls
- Compact horizontal pills with background `#F1F5F9`, border `1px solid #E2E8F0`, padding `2px`.
- Active segment: `#FFFFFF` surface, `1px solid #CBD5E1`, text `#1E293B`, font weight `600`, subtle inset shadow.
- Inactive segments: text `#64748B`, font weight `500`. Hover brings text to `#334155`.

### Chips & Badges
- **Accreditation / Status Chips:** Height `20px`, padding `0 6px`, radius `4px`, font size `11px`, font weight `600`.
- **Approved / Validated:** Background `#ECFDF5`, text `#065F46`, border `1px solid #A7F3D0`.
- **Pending Review:** Background `#EFF6FF`, text `#1E40AF`, border `1px solid #BFDBFE`.
- **Draft / Incomplete:** Background `#F1F5F9`, text `#475569`, border `1px solid #E2E8F0`.

### Form Fields & Inputs
- Height `34px`, font size `13px`, border `1px solid #CBD5E1`, background `#FFFFFF`, radius `4px`.
- Focus state: border `#2563EB`, ring outline `2px rgba(37, 99, 235, 0.20)`. No full blue glow fill.
- Inline unit add-ons (e.g., "Credits", "Hours") sit in a flush `#F8FAFC` right-anchored sub-box with `1px solid #CBD5E1`.

### Checkboxes & Radios
- Size `16px x 16px`, radius `3px` (checkbox) or circular (radio), border `1.5px solid #94A3B8`.
- Checked state: background `#2563EB`, border `#2563EB`, checkmark icon white, crisp vector.

### Cards & Module Containers
- Outer structure: background `#FFFFFF`, border `1px solid #E2E8F0`, radius `8px`.
- Card Header: padding `10px 16px`, background `#F8FAFC`, bottom border `1px solid #E2E8F0`. Features drag-handle grip dot pattern for syllabus reordering.
- Card Body: padding `12px 16px`.

### Specialized Domain Components
- **Competency Matrix Node:** A grid cell component mapping course learning objectives (CLOs) to program educational objectives (PEOs). Active states illuminate a high-contrast tertiary tick (`#059669`).
- **Prerequisite Pill Tree:** Interactive connector node with a leading anchor dot, displaying dependency status (fulfilled vs unfulfilled) using slate-to-emerald status markers.