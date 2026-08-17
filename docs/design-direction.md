# Design Direction — Home Record

Working notes on the look we're going for. Reference material, not a spec —
but concrete enough to build from.

**The one-line version:** mature, simple, clean. Warm neutrals instead of
stark white, type that's tight and confident, photography doing the talking,
chrome nearly invisible — and one moment of delight in the navigation, which
floats above the content like frosted glass.

---

## 1. Primary reference — [buildcover.com](https://buildcover.com/)

*(`cover.build` redirects here — same company.)*

LA prefab builder. "A beautifully simple way to build." This is the target.

### What they actually use

Pulled from their stylesheets, not eyeballed:

| | Value | Why it matters |
| --- | --- | --- |
| **Display / UI face** | ABC Diatype *(fallback: Helvetica, Arial)* | Neo-grotesque. Neutral, slightly warm, zero personality-for-its-own-sake. |
| **Accent face** | FK Roman Standard *(fallback: Times)* | A **serif**, used sparingly for editorial moments. This is the whole sophistication trick. |
| **Ink** | `#282828` | Not pure black. Softer, reads as considered rather than harsh. |
| **Surface** | `#F4F4F4` | Their dominant colour — a light warm grey, *not* white. |
| **Warm off-white** | `#F7F5F2` | Secondary surface. Slight cream cast. |
| **Letter-spacing** | `-0.01em` → `-0.03em` | Negative tracking on headings. Cheap, enormous effect. |
| **Type scale** | 1 · 1.6 · 2.4 · 3.2 · 4.8 · 5.4 · 6.2 rem | Big jumps. Display type is genuinely large; there's no timid middle. |

### The three moves worth stealing

1. **Grotesque + serif pairing.** A neutral sans for everything functional,
   a serif for one or two editorial lines per page. Instantly more grown-up
   than a single-family site.
2. **Warm grey, not white.** `#F4F4F4` / `#F7F5F2` as the page ground makes
   photography sit *in* the page rather than float on it. Our current
   `bg-white` is the single biggest gap between us and this look.
3. **Tight tracking on big type.** Every heading gets negative letter-spacing.
   This is the highest ratio of effect-to-effort available to us.

### Structure & voice

Hero statement → featured portfolio → design philosophy → process → testimonial
imagery → minimal footer. Full-width architectural photography, cropped for
clean lines and material texture, stacked in a gallery rhythm with generous
gaps.

Copy is aspirational but grounded — *"architect-grade spaces built in weeks,
not years."* Concrete claims, no jargon. Worth matching: our hero currently
says "Complete, verified documentation of every build phase…" which is accurate
but reads like a spec sheet.

### ⚠️ Font licensing

ABC Diatype (Dinamo) and FK Roman Standard (Florian Karsten) are both
**commercial** — we can't just lift the files. Note their own site is serving
`FKRomanStandardTrial-Regular.woff2`, i.e. a trial build in production. Not a
precedent to follow.

**We don't need to buy anything.** `src/assets/fonts/` already contains
**Neue Haas Grotesk** — the neo-grotesque Diatype descends from, and literally
their declared fallback (`Helvetica`). It's a closer match than Inter and it's
already in the repo.

For the serif accent, free options in the same spirit:
**Instrument Serif** (closest — high-contrast modern display),
Newsreader, or Fraunces. All on Google Fonts.

### Secondary reference — [samara.com](https://www.samara.com/)

Still useful, and stronger on a few things Cover doesn't cover:

- Photography as the hero of *every* section, never a collage or a floating
  UI card.
- Modular cards — a small set of shapes, repeated with discipline.
- Standardised CTAs: same placement, same styling, every time.

Skip their mega-menu with image-paired dropdowns — too heavy for an app this
size — and tighten their marketing-site pacing once the user is past the
landing page.

### Sibling references

[abodu.com](https://abodu.com) ·
[dvele.com](https://dvele.com) ·
[denoutdoors.com](https://denoutdoors.com)

For the *vault / documents* half of the product:
[trustworthy.com](https://trustworthy.com) ·
[1password.com](https://1password.com)

---

## 1a. What this costs us — the blue question

Cover's palette is warm neutrals and near-black. Ours is white and
`blue-600`, used everywhere: the badge, the headline span, the CTA, the icons,
the active nav underline.

**Adopting this look means retiring blue as a decorative colour.** Proposal:

- Blue survives as a *functional* signal only — verified state, links,
  focus rings. That's what the `verified` token already exists for.
- The brand carries on neutrals, photography, and type instead.
- Primary CTA becomes near-black (`#282828`) on warm grey, which is both more
  mature and higher contrast than blue-on-white.

This is a real decision, not a detail. Flagging it rather than assuming.

### Candidate tokens

Slotting Cover's values into our existing pipeline
(`src/styles/main.scss` → `tailwind.config.js`):

```
--surface          #F7F5F2   warm off-white — page ground
--surface-raised   #FFFFFF   cards lift by going *lighter*
--surface-sunken   #F4F4F4   section bands
--ink              #282828   never pure black
--ink-muted        #6B6B6B
--line             #E3E1DE   warm-tinted hairline, not grey-200
--brand            #282828   CTA / primary action
--verified         (keep blue — functional only)
```

---

## 2. Apple-style glass tab bar

The one place we allow a bit of delight. A floating, translucent bar that
blurs whatever scrolls beneath it.

### Behaviour

- **Floats** — detached from the viewport edge, with a margin all round. Not a
  full-bleed bar welded to the bottom.
- **Pill-shaped** — fully rounded, sized to its contents rather than the screen.
- **Translucent** — real backdrop blur, so page content is visible and *moving*
  behind it. This is the whole effect; a flat grey bar is not the same thing.
- **Sticky bottom on mobile, top on desktop.** Respect
  `env(safe-area-inset-bottom)` so it clears the iPhone home indicator.
- **The active pill slides** between items. It does not cut, fade, or pop.

### The recipe

The effect is four layers, and it falls apart if any one is missing:

```
1. Blur          backdrop-filter: blur(20px) saturate(180%)
2. Tint          semi-transparent white fill (~70%), NOT opaque
3. Hairline      1px border, plus a brighter inset highlight on the top edge
4. Lift          a soft, wide shadow — the bar hovers, it doesn't sit
```

```css
.glass-tabbar {
  /* 1 + 2 — order matters; -webkit- prefix is still required in Safari */
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  backdrop-filter: blur(20px) saturate(180%);
  background: rgb(255 255 255 / 0.72);

  /* 3 — the hairline is what sells it as glass rather than fog */
  border: 1px solid rgb(255 255 255 / 0.5);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.6),   /* top-edge highlight */
    0 1px 2px rgb(0 0 0 / 0.04),            /* contact shadow */
    0 8px 32px rgb(0 0 0 / 0.12);           /* 4 — the lift */

  border-radius: 9999px;
}

/* Fallback: without blur support, translucency just looks like a bug. */
@supports not (backdrop-filter: blur(1px)) {
  .glass-tabbar { background: rgb(255 255 255 / 0.96); }
}
```

Tailwind equivalent, if we'd rather keep it inline:

```
backdrop-blur-xl backdrop-saturate-150 bg-white/70
border border-white/50 rounded-full
shadow-[0_8px_32px_rgb(0_0_0/0.12)]
```

### Motion

We already ship `framer-motion` — the sliding indicator is a `layoutId`, not a
hand-animated `left` value:

```tsx
{isActive && (
  <motion.div
    layoutId="tabbar-pill"
    className="absolute inset-0 rounded-full bg-white shadow-sm"
    transition={{ type: "spring", stiffness: 400, damping: 32 }}
  />
)}
```

- Spring, not ease — it should feel physical.
- ~350–450ms equivalent. Slower reads as sluggish, faster reads as a jump cut.
- Icons ~24px, labels ~10–11px medium. Label under icon on mobile; label
  beside icon on desktop.
- Honour `prefers-reduced-motion` — drop to a cross-fade.

### Gotchas

- `backdrop-filter` needs something *behind* it. It does nothing over a solid
  parent background.
- A blurred element creates a stacking context — watch `z-index` against the
  existing `z-50` header.
- Blur is GPU-expensive on low-end Android. We already carry WebView polyfills
  in `index.html` for exactly that class of device; test there before shipping.

---

## 3. Clean & simple — the working rules

Things that are easy to say and hard to hold:

1. **Colour is functional, never decorative.** Blue means "verified" or
   "interactive" and nothing else. The page is carried by warm neutrals.
2. **Two weights of text.** Regular and bold — Cover ships exactly two cuts of
   Diatype and needs no more.
3. **Negative tracking on anything above 2.4rem.** `-0.02em` as the default.
4. **Borders over shadows** for structure; shadows only for things that
   genuinely float (the tab bar, dropdowns, modals).
5. **No decorative gradients.** The blurred blob behind the hero panel is a
   placeholder for a photograph, not a design element.
5. **Empty states get the same care as full ones.** A home with no records yet
   is the first thing a new user sees.
6. **If a section needs an explanation, it's not simple yet.** Cut it or
   rewrite it.

---

## 4. How this lands in our codebase

We already have most of the machinery. The gap is consistency, not capability.

### Use the token pipeline

`tailwind.config.js` defines a proper three-layer semantic system —
`surface` / `ink` / `line` / `brand` / `verified` — each resolving to a CSS
variable in `src/styles/main.scss`. That's the right architecture.

But `src/shared/components/Header.tsx` is written entirely in raw
`slate-*`, `gray-*`, `blue-*` utilities, and so is
`src/containers/dashboard/index.tsx`. Every one of those bypasses the
pipeline, which means a palette change has to be done by hand in N files —
exactly what the tokens exist to prevent.

**Rule going forward:** screens write semantic classes (`bg-surface`,
`text-ink-muted`, `border-line`, `text-brand`). Raw palette utilities are a
smell.

### Known gaps

- **Hero** — `src/containers/dashboard/index.tsx:80` is still a lucide `Home`
  icon inside a gradient box. Needs a real photograph.
- **Header** — currently a flat white bar with a `border-b` and a 2px underline
  for the active route. This is what the glass tab bar replaces.
- **Fonts** — config declares `Inter`, but `src/assets/fonts/` already ships
  Neue Haas Display and Neue Haas Grotesk. **Switch to Neue Haas Grotesk as
  the primary face.** It's the Diatype lineage, it's Cover's own declared
  fallback, and we already own it. Add Instrument Serif as the accent face if
  we take the serif pairing.
- **Page ground** — everything is `bg-white`. Moving to `#F7F5F2` / `#F4F4F4`
  is the single highest-impact change on this list.
- **`preflight` is disabled** in the Tailwind config, so base element styles
  come from elsewhere. Check `main.scss` before assuming a default.

---

## 5. Idea board — parked, nothing built

Collecting these before committing to any of them.

### A. The peek carousel

From Cover's homepage. Worth naming precisely, because it's **not** a
before/after comparison slider:

- Full-bleed row of large cards, `~24px` corner radius, `~24px` gaps.
- Cards are ~45% viewport on desktop, so the **next card is always partly
  visible** — that peek is what invites the drag.
- Caption overlaid bottom-left in white, directly on the photo. No card
  footer, no separate text block.
- Drag to scroll, snap to card. Arrows optional and very quiet.

We already have `embla-carousel-react` and a shadcn `carousel.tsx` wrapping it,
so this is styling, not new machinery.

> **Open:** for before/after, do we want *this* (before and after as two
> adjacent cards you scroll between) or a **drag-divider** comparison slider
> (one image, a handle you pull across)? They're different components and
> different feelings. The screenshot is the former.

### B. Sketch → result reveal

The animation idea. A technical drawing wipes away to expose the finished
photograph beneath.

- Two stacked images; the sketch layer is wiped via `clip-path`, not faded.
- A thin bright line travels with the wipe edge — this is what makes it read
  as *drawn* rather than swiped.
- Long and eased-out (~1.2s). Fast makes it a transition; slow makes it a
  reveal.
- Fires once on scroll-into-view. It's a reward for arriving, not a loop.
- `prefers-reduced-motion` → show the result immediately, no wipe.

Why it fits us specifically: this is *literally the product*. Plan → permit →
build → finished. And `examples/1-home-profile/` already holds the floor plan,
the survey and the certificate of occupancy.

### C. Exploded axonometric drawings

The strongest idea of the three, and the most differentiating.

| | Value |
| --- | --- |
| Field / background | `#A3C1D5` — dusty blueprint blue, ~71% of the frame |
| Linework | Near-black, uniform hairline weight |
| Site context | Trees, driveway, plot drawn in a **lighter** tone so the building stays the subject |
| Annotations | Hand-drawn marker: `A`, `B`, dimension arrows |
| Corners | Same generous radius as the photo cards |

Structurally it's an **exploded** axo — floors lifted apart vertically with
dashed leader lines showing how they stack.

Why this might beat photography for us:

1. **It says "every layer documented"** in a way a photo of a nice kitchen
   never will. The exploded view *is* our value proposition.
2. **No licensing, no model releases, no stock-photo tells.** Sidesteps the
   entire asset-sourcing problem from the earlier notes.
3. **It's ownable.** Every competitor uses warm interior photography. Nobody
   in this space uses drawings.
4. The hand-drawn `A`/`B` annotations add exactly enough human warmth to stop
   it feeling cold or corporate.

Cost: these are illustration work. Either commissioned, or built from the
actual floor plans we already ship as PDFs.

### The synthesis

These three aren't separate — they compose:

> A **peek carousel** (A) of home-record moments, where each card **reveals
> from exploded axonometric drawing to finished photograph** (B → C) as it
> scrolls into view.

That's one coherent idea, it's on-brand, it's technically cheap given what's
already installed, and it tells the product story without a word of copy.

---

## 6. Voice & motto

### The idea in one sentence

> Your house, whole — from the first sketch to the last receipt.

Three things have to survive into the copy: **one place** (it's all here),
**start to finish** (the entire life of the house, not just today), and
**yours to hand on** (it transfers at sale). Most competitors land the first
and drop the other two.

### Candidates

**One place** — plainest, warmest, closest to how you'd say it out loud.

- **Your whole house, in one place.**
- One home. One record.
- Everything about your home. In one place.

**Start to finish** — pairs directly with the sketch → result reveal (§5B).

- **From the first sketch to the final walkthrough.**
- From blueprint to backyard.
- From the first drawing to the last receipt.
- Every phase, every permit, every photo.

**Memory** — the most emotional angle, and the most ownable.

- **Everything your house has ever been.**
- The complete history of your home.
- Your house has a story. This is where it lives.

**Proof** — leads with trust; best for the verification sections.

- **Proof, not paperwork.**
- Verified from the ground up.
- Every layer, on the record.
- Documented. Verified. Transferable.

**Handover** — the differentiator nobody else can claim.

- **Hand over the keys. And the history.**
- Sell the house. Pass on the proof.

### Recommended

**H1** — Your whole house, in one place.

**Sub** — Every plan, permit, renovation and receipt, from the first sketch to
the final walkthrough. Verified, and yours to hand on.

Warm and human up top; the sub does the work of naming the artefacts, the
lifecycle and the transfer. The plainness is the point — it sounds like a
person, not a product page.

Bolder alternative, if we go all-in on the drawings direction (§5C):
**Everything your house has ever been.**

Closing section, above the final CTA:
**Hand over the keys. And the history.**

### How this changes what's live

Current hero reads:

> Your Home's **Complete Record** — Complete, verified documentation of every
> build phase, renovation and repair on your property.

Accurate, but it's a spec sheet. "Complete" appears twice, "documentation of"
is doing nothing, and nothing in it sounds like a person. Compare Cover:
*"architect-grade spaces built in weeks, not years"* — a concrete claim in
plain words.

### Rules

1. **Say the thing, don't describe the thing.** "Every permit" beats
   "comprehensive documentation of regulatory approvals".
2. **Name real artefacts.** Permits, receipts, warranties, photos, plans.
   Concrete nouns are what make it feel true.
3. **No blockchain in the headline.** It's the mechanism, not the benefit.
   "Verified" is the promise; the chain is a footnote.
4. **Sentence case.** Title Case reads corporate.
5. **One idea per line.** If it needs a comma splice, it's two lines.

---

## 7. Decisions taken

Recorded here rather than left open, because the token layer, the landing page
and the drawings are all built on them. Anything still genuinely undecided is in
"Still open" below.

| Question | Decision |
| --- | --- |
| **Retire blue as a brand colour?** | **Yes.** `--brand` is `#282828`; the primary CTA is near-black on warm grey. Colour that remains is functional: `verified`, `warn`, `alert`, and the five `cat-*` section accents. |
| Warm ground vs. white? | **Warm.** `--surface` `#F7F5F2`, `--surface-sunken` `#F4F4F4`, cards lift by going *lighter* to `#FFFFFF`. |
| **Drawings or photography?** | **Drawings.** See §5C — the exploded axonometric *is* the value proposition, and it removes the licensing and stock-photo-tell problem entirely. Photography can still be added later; nothing in the layout assumes drawings. |
| Serif accent? | **Not yet.** Single-family Neue Haas Grotesk, which we already own and which is now the `sans` default. Revisit if the pages read flat. |
| Before/after: carousel or drag-divider? | **Peek carousel**, with the §5B sketch→result wipe on each slide. `BeforeAfterCarousel.tsx` already implemented both the peek and the wipe; it had no assets until now. The drag-divider comparison slider was not built. |
| Does the glass bar replace `Header.tsx`? | **Coexist.** A quiet top bar carries identity and the account action; a floating glass pill carries the routes — bottom on mobile, top on desktop. |
| Dark mode? | **Kept working.** Warm dark, so the two themes read as one family. Not the demo default. |
| Blueprint blue alongside warm neutrals? | **Yes, scoped.** `#A3C1D5` is the axonometric's field and a tint inside drawings. It is not a UI colour. |
| Motto | **"Your whole house, in one place."** as the H1; **"Hand over the keys. And the history."** closes the page. The bolder "Everything your house has ever been." is the axonometric's own headline. |

### Still open

- [ ] Do we rename the product in the header from "Home Record"?
- [ ] Photography: commission real interiors later, or stay on drawings permanently?
- [ ] Are the five `cat-*` accents still too colourful now the rest of the page
      is neutral? They are muted, but they are the only hues left.

