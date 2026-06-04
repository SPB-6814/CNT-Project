---
name: Post-Quantum Vault
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#b9ccb2'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#84967e'
  outline-variant: '#3b4b37'
  surface-tint: '#00e639'
  primary: '#ebffe2'
  on-primary: '#003907'
  primary-container: '#00ff41'
  on-primary-container: '#007117'
  inverse-primary: '#006e16'
  secondary: '#ffe2ab'
  on-secondary: '#402d00'
  secondary-container: '#ffbf00'
  on-secondary-container: '#6d5000'
  tertiary: '#fbf8fb'
  on-tertiary: '#303032'
  tertiary-container: '#dfdcde'
  on-tertiary-container: '#616063'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#72ff70'
  primary-fixed-dim: '#00e639'
  on-primary-fixed: '#002203'
  on-primary-fixed-variant: '#00530e'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#fbbc00'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#e4e2e4'
  tertiary-fixed-dim: '#c8c6c8'
  on-tertiary-fixed: '#1b1b1d'
  on-tertiary-fixed-variant: '#474649'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  headline-lg:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The design system is engineered for maximum security and industrial precision. It targets a highly technical audience—cryptographers, security engineers, and data privacy advocates—who require a UI that feels as resilient as the algorithms it protects.

The aesthetic combines **Glassmorphism** with **High-Contrast Terminal** influences. It evokes the feeling of a heavy-duty cryptographic tool: cold, calculated, and indestructible. Every interface element must feel intentional and grounded in logic, utilizing subtle translucent layers to suggest depth while maintaining a flat, professional structure. The emotional response is one of total control and unwavering digital safety.

## Colors

The palette is strictly dark-mode, designed to minimize eye strain during long periods of data monitoring while emphasizing the "Terminal Green" primary action color.

- **Backgrounds:** The foundation is Obsidian (#0A0A0B). Surface containers use Slate-Gray (#1E1E20) with varying opacities to create hierarchy.
- **Primary Action:** Terminal-Green (#00FF41) is used for success states, active encryptions, and primary calls to action.
- **Warnings:** Amber (#FFBF00) is reserved for constraints, potential data leaks, or system warnings.
- **Functional Accents:** Border colors should remain low-contrast (Slate-Gray at 40% opacity) to ensure the glass effect feels integrated rather than floating.

## Typography

This design system utilizes a dual-font strategy to balance technical readability with UI clarity.

- **JetBrains Mono** is the "Data Voice." Use it for all headlines, code blocks, metrics, and labels. It reinforces the system's technical pedigree and ensures that character differentiation (like 0 vs O) is clear for cryptographic keys.
- **Inter** is the "Utility Voice." Use it for body text, descriptions, and standard UI controls. Its neutrality prevents the interface from becoming visually overwhelming.

All monospaced labels should use a slight letter-spacing increase to improve legibility on dark backgrounds. Headlines should be tight and impactful.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model to simulate a desktop workstation environment. 

- **Desktop:** 12-column grid with a max-width of 1440px. 24px gutters provide breathing room between heavy data containers.
- **Tablet:** 8-column grid with 24px margins.
- **Mobile:** 4-column grid with 16px margins. 

The spacing rhythm is strictly based on multiples of 8px. This creates a predictable, modular structure that feels engineered rather than "designed." Use larger gaps (48px+) only to separate distinct functional zones, such as the File Explorer from the Encryption Settings.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Layering** and **Glassmorphism** rather than traditional ambient shadows.

- **Surfaces:** Use a semi-transparent Slate-Gray (#1E1E20) at 60-80% opacity with a `20px` backdrop blur. This creates a "Frosted Obsidian" effect.
- **Borders:** Every container must have a 1px solid border. Use Slate-Gray at 30% opacity for inactive states, and Terminal-Green at 50% opacity for active or focused states.
- **Glow Effects:** Instead of drop shadows, use a `box-shadow` with `0px 0px 15px` spread and low opacity (20%) using the Primary color for active elements. This simulates a CRT-monitor phosphor glow.
- **Stacking:** Modals and overlays should increase in brightness (lighter gray) to indicate they are closer to the user in the Z-axis.

## Shapes

The shape language is **Soft (Level 1)**. 

While the system is industrial, 0px sharp corners feel unnecessarily aggressive. A `4px` base radius (`0.25rem`) provides a modern, machined feel—reminiscent of hardware components or server racks. 

- **Standard Elements:** 4px (Buttons, Inputs, Cards).
- **Interactive Accents:** Tabs and pill-indicators may use up to 8px for clear differentiation from the background grid.
- **Checkboxes:** Must remain strictly 2px or 4px rounded to maintain a technical appearance.

## Components

### Buttons
Primary buttons use a solid Terminal-Green background with JetBrains Mono bold text in Black. On hover, apply an "Active Glow" (`box-shadow: 0 0 12px #00FF41`). Secondary buttons are ghost-style with 1px borders.

### Drag-and-Drop Zones
Drop zones must feature a dashed 2px border in Slate-Gray. When a file is hovered over the zone, the border animates a "marching ants" effect and changes color to Terminal-Green.

### Responsive Tabs
Tabs are styled as "Machined Switches." Active tabs feature a high-contrast bottom border (2px) in Terminal-Green and a subtle background tint. Inactive tabs remain transparent.

### Input Fields
Fields use a dark background (#0A0A0B) with 1px borders. The cursor should be a solid green block to mimic a terminal input.

### Warning & Info Boxes
- **Warning:** Amber (#FFBF00) left-accent border with a 10% Amber background tint.
- **Success/Info:** Terminal-Green (#00FF41) left-accent border with a 10% Green background tint.
All boxes use JetBrains Mono for the content to signify "System Output."

### Progress Bars
Use a "segmented" appearance rather than a smooth fill to reinforce the digital/data-packet nature of the encryption process.