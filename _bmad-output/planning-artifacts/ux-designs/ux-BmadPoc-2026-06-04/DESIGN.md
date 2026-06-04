---
title: BmadPoc Search Application Visual Identity (DESIGN.md)
status: draft
created: 2026-06-04
updated: 2026-06-04
colors:
  primary: "#3B82F6"
  primaryHover: "#2563EB"
  primaryActive: "#1D4ED8"
  secondary: "#10B981"
  secondaryHover: "#059669"
  secondaryActive: "#047857"
  background: "#0F172A"
  surface: "#1E293B"
  text: "#F8FAFC"
  textMuted: "#94A3B8"
  border: "#334155"
  borderFocus: "#3B82F6"
  success: "#10B981"
  error: "#EF4444"
typography:
  fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  fontSize:
    base: "16px"
    sm: "14px"
    lg: "18px"
    h1: "26px"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  card:
    background: "{colors.surface}"
    border: "1px solid {colors.border}"
    borderRadius: "{rounded.md}"
    padding: "{spacing.lg}"
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)"
  buttonPrimary:
    background: "{colors.primary}"
    color: "{colors.text}"
    borderRadius: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.md}"
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
  buttonSecondary:
    background: "transparent"
    color: "{colors.text}"
    border: "1px solid {colors.border}"
    borderRadius: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.md}"
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
  table:
    border: "1px solid {colors.border}"
    headerBackground: "#1E293B"
    rowHover: "#334155"
---

# Visual Identity & Design Tokens (DESIGN.md)

## 1. Brand & Style
The **sg-search** application uses a **Vibrant Dark-Mode Tech** visual identity. It is designed to look highly modern, energetic, and engaging for developers. The aesthetic features a rich dark background with vibrant neon blue and emerald accents, smooth transition animations, tactile hover states, and glowing focus cues that make the interface feel incredibly alive and reactive.

## 2. Colors
- **Primary Accent (`{colors.primary}`)**: Electric Blue (`#3B82F6`) used for the main search button, focus rings, and primary accents.
- **Secondary Accent (`{colors.secondary}`)**: Vibrant Emerald (`#10B981`) used for success states, table highlights, and the Clear button outline.
- **Background (`{colors.background}`)**: Deep Slate Navy (`#0F172A`) used for the main page background.
- **Surface (`{colors.surface}`)**: Rich Dark Slate (`#1E293B`) used for the search card, input backgrounds, and table containers.
- **Text (`{colors.text}`)**: Crisp Ice White (`#F8FAFC`) used for body text and labels to ensure maximum contrast.
- **Text Muted (`{colors.textMuted}`)**: Cool Gray (`#94A3B8`) used for secondary text, placeholders, and labels.
- **Border (`{colors.border}`)**: Subtle Dark Slate (`#334155`) used for default input borders and table grid lines.

## 3. Typography
- **Font Family (`{typography.fontFamily}`)**: Modern system sans-serif stack (Inter, Segoe UI) for clean rendering across Windows and macOS.
- **Sizes**:
  - Heading (H1): `26px` (bold, electric blue accent)
  - Body (Base): `16px` (ice white)
  - Small (SM): `14px` (cool gray, used for table headers and helper text)

## 4. Layout & Spacing
- **Container**: A centered, single-column layout with a maximum width of `800px`.
- **Card Spacing**: Spacing of `24px` (`{spacing.lg}`) padding inside the main container card.
- **Form Layout**: A responsive 2-column grid for the inputs (First Name, Last Name) on desktop, collapsing to a single column on mobile.

## 5. Elevation & Depth
- **Card Shadow**: A rich, deep shadow with ambient occlusion (`0 10px 15px -3px rgba(0, 0, 0, 0.3)`) to elevate the search card from the deep navy background, giving it a premium, floating feel.

## 6. Shapes
- **Corners**: Rounded corners of `10px` (`{rounded.md}`) for cards and `6px` (`{rounded.sm}`) for input fields and buttons to maintain a sleek, modern tech aesthetic.

## 7. Components
- **Search Card**: Centered card containing the search form, status message, and results table.
- **Inputs**: Text inputs with a subtle dark border (`#334155`) and dark background (`#0F172A`). They transition smoothly on focus to a glowing electric blue border (`#3B82F6`) with a soft blue shadow (`box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2)`).
- **Buttons**:
  - **Search Button**: Solid electric blue background, ice white text. It transitions smoothly on hover to a richer blue (`#2563EB`), scales down slightly on click (`transform: scale(0.97)`), and has a subtle blue glow.
  - **Clear Button**: Transparent background, subtle border, ice white text. It transitions to a glowing emerald border (`#10B981`) and emerald text on hover, scaling on click.
- **Results Table**: Full-width table with a dark slate header background, ice white text, and a vibrant row hover effect that highlights the row with a slate gray background (`#334155`) and a left-side emerald accent border.

## 8. Do's and Don'ts
- **Do**: Use CSS transitions (`transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`) on all interactive elements (inputs, buttons, rows) to ensure the UI feels highly reactive and fluid.
- **Do**: Use `textContent` to render all dynamic values in the table to prevent XSS.
- **Do**: Maintain a clear contrast ratio of at least 4.5:1 for all text elements.
- **Don't**: Use harsh, sudden state changes without transition durations.
- **Don't**: Allow the table to overflow the card container; use responsive horizontal scrolling if needed.
