# Work queue

Everything asked for in this round, in the order it was asked. Kept here rather
than in a chat log so the state of each item survives the session.

Branch: `feat/design-system-preview-media`.

---

## Shipped

Committed and pushed. Three commits on top of `894db83`.

### 1. Start a project from the vault header

`a371095` — "Offer New project from the vault header, beside Add record"

Starting a project was only reachable as a dashed card at the foot of the
Projects grid. It now also sits in the header bar beside Add record, secondary
to it, under the same conditions the Projects block puts on its own card: the
option on, signed in, no section open, and a home rather than a project.

### 2. Add a section to a vault

`31a7f6d` — "Let a homeowner add a section to a vault that already has some"

A dashed card at the end of the sections grid opens a full page form. It offers
the template sections the vault is missing as chips and takes a typed name for
anything else; typing the name of one of the five resolves to that one rather
than standing a near duplicate beside it. The form closes on submit and a
placeholder holds the slot while the stream is anchored, polling for 90 seconds.

Calls web-core's `addStreamToVault`, which was published but not bound in this
app. Two bugs found while building: sagas see an action after the reducers do,
so the one-at-a-time guard has to read state the saga raises rather than the
trigger; and a run finishing after the homeowner has navigated away must not put
its own vault into a store that now holds a different one.

### 3. One card for a vault

`f58b53f` — "Draw a project with the homes-list card, so the two grids match"

The homes list and the projects grid drew the same object with two components,
which is how they ended up at different column widths, gaps and footer spacing.
One `VaultCard` now serves both, with the grid metrics exported beside it.

---

## Done, not yet committed

All of this is in the working tree. Tests, typecheck and build pass.

### 4. Better source for the hero film

The committed master was a 3.0 Mbps re-encode of a 7.9 Mbps original sitting in
Downloads, same 720p and same 169 frames, structural similarity 0.96. The
original is now the master and the two cuts and two stills are regenerated from
it. The desktop cut measures 0.927 against an uncompressed reference where it
used to measure 0.911.

No higher resolution master exists on this machine. Google Drive was not
searched: the connector is attached but not authorised to read files.

### 5. The frame that is always on screen

The still was being cut at 6.8 seconds, which is not the frame the film ends on.
Structural similarity between the two is 0.51, because the sun is still moving.
So the reduced motion image was a different picture from the one everyone else
was left looking at.

The still is now the exact final frame, pulled by seeking the last half second
rather than a fixed timestamp so it survives a recut. The hero fades the video
out to it when playback ends. Measured against an uncompressed reference, the
frame that holds the fold went from 0.873 to 0.989.

### 6. Mobile nav

Two fixes. "My Homes" was breaking onto two lines, because the bottom pill is
`fixed` and so sizes to its own content. And the active chip was filled with the
blueprint accent, which made the most persistent coloured element in the app a
second brand; the palette is explicit that blue is retired as decoration and
that blueprint is a support colour. It is now the brand near black, the same
token the primary button uses, and it inverts to near white in dark mode.

### 7. Glass that adapts to its backdrop

A 72 percent white veil erases whatever is behind it, which is how a material
meant to read as glass ends up reading as frosted plastic over the film. The
veil drops to 55 percent and a brightness pass lifts the backdrop instead, so
its picture and colour survive. Contrast over the film goes from about 8:1 to
about 5.5:1, still past AA. On the warm ground the lift clips to white and the
result lands within two levels of what the thick veil produced, so one material
serves both. Dark mode lowers rather than lifts.

### 8. Header island width

The island was capped a size narrower than the page well beneath it, so on a
wide screen the structure column started to its left and the cards ran out past
its right. It now takes its width from the same `measureFor` the page uses.

---

## Planned, not started

### 9. A second glass tier for in page surfaces

Agreed in principle, waiting on a go ahead.

Today six places use `glass`, and they share one property: content moves
underneath them. Header island, mobile nav pill, dropdown menus, upload tray,
the bars inside the three full page forms, and the mobile structure drawer.

The proposal is a second material for surfaces that sit still in the page and
want the family look. It is deliberately not backdrop blur, which costs GPU on
every paint and buys no picture when there is nothing moving to see through to.
The resemblance comes from the material's other three layers: a translucent tint
instead of solid white, the white top edge highlight, and a softer hairline.

Where it would go:

- Section cards, the five on the vault page
- `VaultCard`, so the homes list and the projects grid both take it
- The structure column on desktop; its mobile drawer stays tier one
- The provenance bar under the vault hero
- The footer, which sits in the page and so belongs here rather than becoming a
  floating island
- The two placeholder cards, so work in progress matches its neighbours

Where it would not: inputs, file tiles, chips, menu rows. Those are elements
inside a surface, not surfaces.

One correction to fold in while there. Saturation is at 180 percent, tuned to
fight the thick veil that is now gone, and over the film's lawn the material
takes a green cast. Proposed 140 percent. Comparison renders were made against
the real stylesheet and the real frame.

### 10. Style the date picker

The last control that does not match the design system. The record date in the
upload form is a native `<input type="date">` wearing `FIELD_CLASS`, so the
platform draws its own calendar indicator at its own inset and in its own
colour. This is the same problem the select had, and it has a solved shape to
copy: `SELECT_CLASS` turns the native arrow off with `appearance-none` and
`SelectShell` puts ours back on the field's own padding.

Plan: hide `::-webkit-calendar-picker-indicator`, put a `lucide` calendar glyph
in a shell beside it, and open the picker from the whole field rather than from
the glyph alone.

### 11. A standard example set per section

Give every section the same shape of demo content: images and PDFs named after
the section they sit in, rather than the current mix. `scripts/generateExampleFiles.ts`
and `scripts/generateExampleMedia.mjs` already build the example corpus, so this
is a change to what they generate and to the naming, not a new pipeline.
