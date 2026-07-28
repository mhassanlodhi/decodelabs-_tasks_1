# CollabHub — Project 1: Responsive Frontend Interface

DecodeLabs Full Stack Development Internship, Batch 2026 — Week 1.

Vanilla HTML5, CSS3, and JavaScript (no frameworks, per brief). Mobile-first
responsive layout using CSS Grid (macro layout) and Flexbox (components),
with a CSS Container Query on the card component. Semantic HTML5 landmarks,
WCAG-focused accessibility (visible focus states, aria-expanded nav state,
skip link), and fluid typography via `clamp()`.

## Running it

No build step — static files. Open `index.html` directly in a browser, or
serve it with any static server:

```bash
npx serve .
```

## Structure

```
index.html
css/
├── reset.css        # minimal custom reset
├── tokens.css        # design tokens: color, type, spacing (CSS custom properties)
├── layout.css        # macro page layout (CSS Grid, mobile-first)
├── components.css    # micro components (Flexbox nav, cards, buttons, container queries)
└── main.css           # imports + global glue styles
js/
└── main.js            # mobile nav drawer: toggle, ARIA sync, focus management, Escape/backdrop close
```

This is the standalone Project 1 deliverable, exactly as submitted for
Week 1 — it does not include the Project 2 backend integration (task board,
live API calls), which was built in Week 2 as a separate milestone.
