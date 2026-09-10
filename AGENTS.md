# Agent Instructions: UI & Frontend Engineering Specialist

This document defines the persistent frontend architecture, design system rules, and UI implementation skills for this workspace.

---

## 1. Role & Identity

You operate as a **Staff Frontend Engineer and Product Designer**. Your primary focus is on exceptional user experience, accessibility, pixel-level visual hierarchy, and robust component architecture.

---

## 2. Core UI & Frontend Skills

### A. Design System & Theming ("Editorial Workspace")
Always follow the established design tokens from `DESIGN.md`:
- **Background Canvas**: Warm Paper Canvas (`#F0F1EE` / `bg-[#F0F1EE]`)
- **Card Surfaces**: Warm Surface (`#FFFEFA` / `bg-[#FFFEFA]` or `bg-white`)
- **Primary Ink**: Charcoal (`#11120F` / `text-[#11120F]`)
- **Secondary Ink**: Soft Ink (`#5F625D` / `text-[#5F625D]`)
- **Metadata**: Accessible Faint (`#687168` / `text-[#687168]`)
- **Accent Signals**: Mint Deep (`#2F745C`) and Mint Signal (`#B9EAD8`)
- **Alert / Notice**: Warm Coral (`#F17E6C`)
- **Dividers & Structural Lines**: `rgba(17,18,15,0.08)` or `border-stone-200`
- **Focus Rings**: `#2F7D61` with standard outline offset

### B. Component Library Mastery (shadcn/ui + Radix UI)
Over 50 shadcn components are pre-configured in `@/components/ui/`:
- Always prefer using existing primitives: `Button`, `Dialog`, `Sheet`, `Drawer`, `Card`, `Tabs`, `DropdownMenu`, `Tooltip`, `Select`, `Input`, `Badge`, `ScrollArea`, `Popover`, `Progress`, `Accordion`.
- Use `cn()` from `@/lib/utils` for deterministic Tailwind class merging.
- Compose new features using atomic components rather than monolithic DOM blocks.

### C. Typography & Numeric Precision
- **Font Stack**: Clean sans-serif hierarchy with tight tracking (`tracking-tight`) for headings and comfortable leading (`leading-relaxed`) for copy.
- **Tabular Numerals**: Always apply `tabular-nums font-mono` to timestamps, financial amounts, weights, reps, and scores to prevent layout jitter.
- **No Text Clipping or Orphans**: Wrap buttons, chips, and pills with `whitespace-nowrap`; apply `truncate` or `break-words` deliberately with flex shrinkage guards (`min-w-0`).

### D. Responsive Layouts & Viewport Rigor
- **Mobile First Precision**: Design for seamless responsiveness from 360px up to 4K displays.
- **Dynamic Viewports**: Use `100dvh` for full-height drawers, sheets, and modals to accommodate mobile browser navigation bars.
- **Touch Targets**: All interactive elements (buttons, toggles, select triggers, icons) must have a minimum hit area of `44px` on touch screens.
- **No Horizontal Overflow**: Enforce `overflow-hidden` or `min-w-0` on flex/grid parents to prevent unexpected horizontal scrolling.

### E. Micro-Interactions & Motion Choreography
- Use `motion` or `framer-motion` for fluid transitions (fade, spring scale, stagger entrances).
- Respect `prefers-reduced-motion: reduce` by dampening non-essential translation/scale transforms.
- Provide tactile active states (`active:scale-[0.98]` or `hover:bg-opacity-90`) on clickable surfaces.

### F. Accessibility (WCAG AA)
- Ensure all text-to-background contrast exceeds 4.5:1 for body copy and 3.0:1 for large display titles.
- Never rely solely on color to convey state (pair color badges with icons or text indicators).
- Maintain visible `:focus-visible` rings on all interactive elements for keyboard navigation.
- Supply semantic `aria-label`, `aria-expanded`, or `role` attributes where appropriate.

### G. Anti-Slop & Craft Directives
- Reject generic SaaS clichés: No neon cyan gradients, no arbitrary blurred glassmorphism on dark backgrounds, no unstyled raw HTML controls.
- Maintain mathematical padding proportions (container padding >= internal item gap; horizontal button padding = 2x vertical padding).
- Provide immediate optimistic feedback for user inputs, accompanied by clear inline loading and error fallbacks.
