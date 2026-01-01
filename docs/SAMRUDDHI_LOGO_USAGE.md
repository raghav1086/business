# Samruddhi Logo Usage Guide

**Version:** 1.0  
**Created:** 2025-01-27  
**Status:** Logo Design & Usage Documentation  
**Purpose:** Complete guide for using Samruddhi logos across different contexts

---

## Logo Variations

### 1. **samruddhi-logo.svg** (Full Logo - Horizontal)
**Dimensions:** 300 × 120px  
**Use Case:** Primary logo for websites, headers, marketing materials  
**Contains:** Icon mark + Sanskrit text "समृद्धि" + English "Samruddhi" + tagline

**Best For:**
- Website headers
- Email signatures
- Business cards
- Brochures
- Presentations

---

### 2. **samruddhi-logo-icon.svg** (Icon Only)
**Dimensions:** 120 × 120px  
**Use Case:** App icon, favicon, social media profile picture  
**Contains:** Icon mark only (growth symbol in circle)

**Best For:**
- Mobile app icon
- Website favicon
- Social media profile pictures
- Small spaces where text won't fit
- Watermarks

---

### 3. **samruddhi-logo-horizontal.svg** (Compact Horizontal)
**Dimensions:** 400 × 100px  
**Use Case:** Navigation bars, compact headers  
**Contains:** Icon mark + Sanskrit + English (no tagline)

**Best For:**
- Navigation bars
- Mobile headers
- Compact spaces
- Footer logos

---

### 4. **samruddhi-logo-vertical.svg** (Vertical Stack)
**Dimensions:** 200 × 250px  
**Use Case:** Sidebars, vertical layouts, posters  
**Contains:** Icon mark (top) + Text (bottom) stacked vertically

**Best For:**
- Sidebar navigation
- Vertical banners
- Posters
- Mobile app splash screens
- Social media posts (portrait)

---

### 5. **samruddhi-logo-text-only.svg** (Text Only)
**Dimensions:** 250 × 80px  
**Use Case:** When icon isn't needed, text-focused designs  
**Contains:** Sanskrit "समृद्धि" + English "Samruddhi" only

**Best For:**
- Text-heavy designs
- Email signatures (compact)
- When icon space is limited
- Print materials (text-focused)

---

## Logo Design Elements

### Icon Symbolism

The logo icon represents:

1. **Growth Arrow/Plant**: Upward growth, prosperity, progress
2. **Circle Background**: Wholeness, completeness, stability
3. **Gradient Colors**: 
   - Blue → Green: Trust to Growth
   - Orange accent: Energy, action, Indian heritage
4. **Foundation Base**: Stability, solid foundation
5. **Prosperity Dots**: Abundance, multiple benefits

### Color Palette

**Primary Colors:**
- **Deep Blue**: `#1E3A8A` (Trust, Professionalism)
- **Growth Green**: `#059669` (Prosperity, Success)
- **Accent Orange**: `#F97316` (Energy, Action)

**Gradients:**
- Primary: Blue to Green (trust to growth)
- Accent: Orange gradient (energy)

### Typography

**Sanskrit Text:**
- Font: Noto Sans Devanagari (fallback: Arial)
- Size: 32-38px (varies by logo)
- Weight: 700 (Bold)
- Color: Gradient (Blue to Green)

**English Text:**
- Font: Inter (fallback: Arial)
- Size: 20-24px (varies by logo)
- Weight: 600 (Semi-bold)
- Color: Deep Blue `#1E3A8A`
- Letter-spacing: 0.5-1.5px

---

## Usage Guidelines

### ✅ Do's

1. **Maintain Proportions**: Always scale logos proportionally
2. **Clear Space**: Maintain minimum clear space of 1x the icon height around the logo
3. **Background Contrast**: Use on white or light backgrounds for best visibility
4. **Size Minimums**: 
   - Full logo: Minimum 200px width
   - Icon only: Minimum 32px × 32px
5. **Color Consistency**: Use provided SVG files to maintain exact colors

### ❌ Don'ts

1. **Don't Stretch**: Never distort or stretch the logo
2. **Don't Rotate**: Keep logo in horizontal orientation (unless using vertical version)
3. **Don't Recolor**: Don't change the gradient colors arbitrarily
4. **Don't Add Effects**: Don't add shadows, outlines, or other effects
5. **Don't Separate**: Don't separate icon from text (unless using icon-only version)
6. **Don't Use on Busy Backgrounds**: Ensure sufficient contrast

---

## Implementation Examples

### Website Header

```html
<!-- Full horizontal logo -->
<img src="/samruddhi-logo.svg" alt="Samruddhi - Where prosperity meets purpose" height="60" />
```

### Mobile App Icon

```html
<!-- Icon only -->
<link rel="icon" href="/samruddhi-logo-icon.svg" />
```

### Navigation Bar

```html
<!-- Compact horizontal -->
<img src="/samruddhi-logo-horizontal.svg" alt="Samruddhi" height="40" />
```

### Email Signature

```html
<!-- Text only (compact) -->
<img src="/samruddhi-logo-text-only.svg" alt="Samruddhi" height="30" />
```

### Social Media Profile

```html
<!-- Icon only (square) -->
<img src="/samruddhi-logo-icon.svg" alt="Samruddhi" width="200" height="200" />
```

---

## File Formats

### SVG (Scalable Vector Graphics)
**Primary Format** - Use for web, digital materials
- ✅ Scalable without quality loss
- ✅ Small file size
- ✅ Editable
- ✅ Works in browsers, design tools

### PNG Export (If Needed)
For contexts where SVG isn't supported:
- **High-res**: 300 DPI for print
- **Web**: 72-96 DPI for digital
- **Transparent background**: Use when needed
- **Sizes**: Export at 2x, 3x for retina displays

### PDF Export (For Print)
- Vector format for print materials
- Maintains quality at any size
- Use for business cards, letterheads

---

## Color Variations

### Light Background (Default)
Use standard logos on:
- White backgrounds
- Light gray backgrounds
- Light colored backgrounds

### Dark Background
For dark backgrounds, create inverted version:
- White text instead of colored
- White icon instead of colored
- Maintain same design structure

### Monochrome
For single-color printing:
- Black version for dark backgrounds
- White version for dark backgrounds
- Maintain readability

---

## Accessibility

### Alt Text Guidelines

Always include descriptive alt text:

```html
<!-- Good -->
<img src="/samruddhi-logo.svg" alt="Samruddhi - Business management platform" />

<!-- Better -->
<img src="/samruddhi-logo.svg" alt="Samruddhi logo - समृद्धि means prosperity" />
```

### Contrast Requirements

- Ensure logo meets WCAG AA contrast ratios
- On light backgrounds: Logo is dark enough
- On dark backgrounds: Use light/white version

---

## Brand Consistency

### Logo Placement

**Preferred Locations:**
- Top left: Website headers, apps
- Top center: Marketing materials
- Bottom: Footers, email signatures

**Avoid:**
- Bottom right (less visible)
- Too small to be recognizable
- Competing with other elements

### Logo Sizing

**Relative to Content:**
- Header: 10-15% of header height
- Footer: 5-10% of footer height
- Marketing: Prominent but not overwhelming

---

## Export Specifications

### For Web
- Format: SVG (preferred) or PNG
- Resolution: 72-96 DPI
- Size: Actual display size or 2x for retina

### For Print
- Format: PDF or high-res PNG
- Resolution: 300 DPI minimum
- Color: CMYK for print, RGB for digital

### For Social Media
- Format: PNG or JPG
- Sizes:
  - Profile: 400 × 400px (square)
  - Cover: 1500 × 500px (Facebook/LinkedIn)
  - Post: 1080 × 1080px (Instagram)

---

## Customization Notes

### When to Customize

✅ **Allowed:**
- Resizing (proportionally)
- Adding tagline below (if space allows)
- Using different variations for different contexts

❌ **Not Allowed:**
- Changing colors
- Modifying the icon design
- Changing fonts
- Adding decorative elements
- Rotating or distorting

---

## Quick Reference

| Context | Logo File | Size | Notes |
|---------|-----------|------|-------|
| Website Header | `samruddhi-logo.svg` | 300×120 | Full logo with tagline |
| Mobile App Icon | `samruddhi-logo-icon.svg` | 120×120 | Icon only |
| Navigation | `samruddhi-logo-horizontal.svg` | 400×100 | Compact, no tagline |
| Sidebar/Poster | `samruddhi-logo-vertical.svg` | 200×250 | Vertical stack |
| Email/Compact | `samruddhi-logo-text-only.svg` | 250×80 | Text only |
| Social Profile | `samruddhi-logo-icon.svg` | 400×400 | Square format |

---

## Support & Questions

For logo usage questions or custom variations:
- Refer to this guide first
- Check brand guidelines document
- Contact design/marketing team for approvals

---

**Document Status:** Complete  
**Last Updated:** 2025-01-27  
**Maintained By:** Design Team

