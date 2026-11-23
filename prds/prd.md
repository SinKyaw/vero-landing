# Task: Redesign the current landing page by recreating the UI/UX patterns of a reference site using our own design system

The current artifact "https://claude.ai/artifact/2joFegg7wBbNQC9zSxuusJ" is built based on the reference on https://dime.co.th/en 

The current index.html is the old version and we have to replace it with the new one, everything except the navigation link since the new one doesn't have navigation concept.

And the UI of the artifact is to be improved further before it can replaced the old one.

Take a look at the https://dime.co.th/en and compare with the artifact, there are some components that the artifact is referencing from the dime.co.th but not in a really good way in terms of UI. You must improved that part. And follow the Below Reference for the rest of the UI.

## Reference
https://appzoku.com/ (open it in a browser and inspect it at desktop and mobile widths before writing any code)

## What to take from it
Copy the layout, hierarchy, interaction patterns and motion feel only. Do NOT copy brand name, copywriting, illustrations, videos, logos, colors, fonts or source code. All styling must come from OUR design system (tokens, components, typography, spacing, radius, shadows). If a pattern needs something our system doesn't have, extend the system in the same style and tell me what you added.

## Our context
- Product: [one line on what the product does]
- Audience: [who it's for]
- Tone of copy: [e.g. confident, short, direct]
- Design system location: [path / Figma link / package]

## Sections to reproduce

### 1. Hero
- Keep the bold, direct, big-type feel, but use much less text than the reference: one headline, one short supporting line (max ~20 words), one primary CTA, and a small trust line under it.
- Drop the extra badges, stats and secondary blocks unless they clearly earn their place.

### 2. Background and visual aesthetic (site-wide mood)
- A soft gradient background combined with a faded grid pattern. The grid should fade out toward the edges or bottom with a mask, so it reads as texture, not as a visible grid.
- Use our brand colors for the gradient. Keep contrast high enough that text stays readable on top.
- Match the reference's overall polish: generous whitespace, strong type hierarchy, consistent rounded corners and subtle borders.

### 3. "How it works" (interactive cards instead of a vertical list)
- Four horizontal step cards at the top, each with a step number, a short title and a one-line subtitle.
- The cards work as tabs and as CTAs: clicking one changes the content panel below (text, bullets and a visual or mockup for that step). The first card is active by default.
- Active card gets a clear visual state (border, background or accent). Hover and focus states on the others.
- Animate the content swap with a short fade or slide, around 200-300ms.
- Mobile: cards become a horizontally scrollable row or a 2x2 grid, with the panel still below.
- Accessibility: use proper tab semantics (role=tablist/tab/tabpanel, arrow-key navigation, aria-selected).

### 4. Pricing
- Two side-by-side cards: a standard plan and a highlighted "limited offer" plan with a scarcity line (e.g. "26 of 100 spots left").
- Per card: plan name, large price with a small qualifier under it ("first month", "once, for life"), a checklist of 3 features, and a full-width CTA.
- Make the highlighted card stand out through contrast, a badge or a border, not by being gaudy.
- Use real pricing from [our pricing], not the reference's.

### 5. FAQ
- Clean accordion: a question row with a chevron or plus icon that rotates, and a smooth height animation on expand.
- Single-open or multi-open is fine (default: single-open). Keyboard accessible, with aria-expanded and aria-controls.
- Generous row padding and subtle dividers.

### 6. Final CTA section
- Short, punchy headline, one supporting line, one button, and a small reassurance line above or below ("free, no card needed").
- Include a subtle animation that draws the eye (soft glow, moving gradient, floating or pulsing element, or a staggered entrance on scroll). Study how the reference does it and recreate the same feel with our tokens.
- Respect `prefers-reduced-motion`: disable or simplify the animation.

## Quality bar
- Fully responsive (mobile first, test at 375, 768 and 1280+).
- Light, performant animations (CSS transforms/opacity, no layout thrash).
- Semantic HTML, keyboard navigation, visible focus states, WCAG AA contrast.
- Reuse existing components where possible; don't duplicate styles.

## How to work
1. Open the reference and note how each section behaves (hover, click, scroll, animation timing).
2. Briefly list which of our existing components map to each section, and what's missing.
3. Build the sections in the order above.
4. Finish with a short summary: what you built, what you extended in the design system, and any place you deviated from the reference and why.


In case you need more ui design reference, please access this folder /Users/machd/Documents/vero/vero+ and also the vero-mobile folder inside to copy the component design. Especially the AppButton design from the vero-mobile is important to be consistent across all design system.