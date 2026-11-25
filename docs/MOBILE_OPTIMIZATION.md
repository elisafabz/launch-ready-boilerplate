# Mobile Optimization Guidelines

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.8s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| First Input Delay (FID) | < 100ms |

---

## Touch Targets & Usability

### Touch Target Size
- **Minimum 48px** for all interactive elements (exceeds WCAG AAA)
- `touch-manipulation` on interactive elements for faster taps
- `active:scale-95` for immediate tactile feedback
- Adequate spacing between interactive elements

### Form Inputs
- **16px font size minimum** on inputs to prevent iOS auto-zoom
- **48px min-height** on all form elements
- Clear focus states and labels

---

## Typography & Readability

### Responsive Scale
- **Small screens (≤375px):** Tighter spacing, smaller typography
- **Large mobile (414–768px):** Enhanced typography scale
- **Tablet (768px+):** Desktop-like experience with touch optimizations

### Principles
- Body text: minimum 1rem with 1.6 line-height
- Headlines: use `clamp()` for fluid scaling
- Maintain WCAG AA contrast ratios (4.5:1 minimum)
- Letter spacing: -0.025em for large headlines

---

## Image & Asset Loading

- `loading="lazy"` on all images below the fold
- `decoding="async"` for non-critical images
- `fetchPriority="high"` for hero/above-the-fold images
- `font-display: swap` for web fonts

---

## Animation Performance

- Shorter animation durations on mobile (0.2s vs 0.3s desktop)
- `prefers-reduced-motion: reduce` — respect user preferences
- Use `transform` and `opacity` only for GPU-accelerated animations
- Avoid animating `width`, `height`, `top`, `left` on mobile

---

## Layout

- Use `100dvh` instead of `100vh` for proper mobile browser support
- Prevent horizontal overflow with `overflow-x: hidden` on containers
- Thumb-zone optimization: key actions within easy reach
- Progressive disclosure: reveal information as needed

---

## CSS Reference

```css
@media (max-width: 768px) {
  /* Enhanced touch targets */
  button, [role="button"], a {
    min-height: 48px;
    min-width: 48px;
  }

  /* Prevent iOS zoom on focus */
  input, textarea, select {
    font-size: 16px;
  }

  /* Native scroll behavior */
  .scroll-container {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
}
```

---

## Checklist

- [ ] All touch targets ≥ 48px
- [ ] No iOS auto-zoom on form inputs
- [ ] Images lazy-loaded below the fold
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No horizontal scroll on any screen size
- [ ] Core Web Vitals pass in Lighthouse
- [ ] Tested on real devices (iPhone SE, iPhone 14, Android)
