# Work queue

Everything asked for in this round, in the order it was asked. Kept here rather
than in a chat log so the state of each item survives the session.

Branch: `feat/design-system-preview-media`.

---

## Shipped

Committed and pushed: eight commits on top of `894db83`.

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

### The hero and the header

Pushed as five commits, `7728bda` through `043626b`.

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
veil drops to 50 percent and the backdrop is normalised instead, so its picture
survives.

Shipped first as a brightness lift, which was half a fix. It solved the film and
ruined everything else: on the warm ground the lift clips to white, so the form
scrolling under a modal's footer bar was washed away and the bar read as a plain
white strip. That is the "I do not see any glass" case, and it was right.

It is a contrast pass now, which works in both directions at once. It lifts what
is too dark and lowers what is too light, so the film shows through the header
and a paragraph passing under the footer stays a soft grey ghost. Against a pure
black backdrop the surface still lands near #A4A4A4, about 5.9 to 1 under the
ink, past AA. Dark mode mirrors it with brightness below one rather than above.

### 8. Header island width

The island was capped a size narrower than the page well beneath it, so on a
wide screen the structure column started to its left and the cards ran out past
its right. It now takes its width from the same `measureFor` the page uses.

---

## Done, not yet committed

In the working tree. Tests, typecheck and build pass.

### 9. A second tier of the glass material

Six card surfaces now share `.pane`: the section cards, the vault card that
serves both grids, the desktop structure column, and the two placeholder cards
for a section or project being created.

It is not a thinner glass, and the reason is worth keeping. The obvious way to
relate the two tiers would be translucency at a lower dose. Rendered against the
real stylesheet it does nothing: the page ground is #F7F5F2 and a card is
#FFFFFF, eight levels apart, so a card at 72% white over it lands within two
levels of the opaque one and the two are indistinguishable side by side. Blur
has even less to work with, since nothing moves behind a card.

What the tiers share instead is depth. Glass hovers on a wide soft shadow;
`.pane` takes the same shadow at about half the weight, so a card rests on the
ground rather than being drawn on it, and the floating layer above it stays
unmistakably higher. The lit top edge comes along and pays off in dark mode,
where a white hairline against #242320 is finally visible.

Saturation went from 180% to 140% at the same time. It was compensating for a
thick veil that no longer exists, and over the film's lawn it was driving the
whole nav pill green.

Two corrections came out of looking at it in the app.

The material was too gentle to see on a flat ground. Over `--surface-sunken` it
landed ten levels off it, which is translucent in principle and invisible in
practice, and a modal's bars read as plain white strips. The contrast pull went
from 0.5 to 0.45 and the brightness lift came off entirely, since a lift undoes
the pull on exactly the flat grounds that need it. The surface now sits around
#D9D9D9 on that ground and still shows the film through it on the landing page.

Then a third disagreement, and the one that explains the rest. Widths were
being set in two shapes. A page well is `mx-auto px-4 max-w-6xl`, so its gutter
is _inside_ the cap and content stops 16px short of it. Chrome was capped at the
measure alone, so it ran to the cap exactly, 16px wider on each side. That is
why the header island still looked wider than the forms after both were put on
the same measure.

`wellFor` now returns the measure and the gutter together, and everything that
has to agree with page content takes it: the header island, the three forms'
bars, and the forms' own fields. One edge, one place to change it. The forms
were also on `max-w-5xl` where pages are on `max-w-6xl`; they are all `wide`
now.

And the three full page forms disagreed about width twice over. Their bars were
capped at the well width while their fields were capped at the same width and
then padded inside it, so the fields sat about 58px inside the bars at every
size; the gutter moves out of the well and onto the scroller, so one `max-w`
governs both. And the add-section form was a size narrower than the other two,
because it has only two fields. It is on the shared measure now, with the
section's own preview card in the 380px column where the project form puts its
cover: the accent and glyph the section will be given, and the slug the backend
will actually store. The three forms are one shell.

Two things from the plan were not done, having looked at their markup. The
provenance bar under the vault hero and the footer are full-bleed bands, not
detached surfaces. The material's whole visible signature here is a drop shadow,
and a shadow under a full-width band reads as a strip peeling off the page,
which is the thing the floating header was designed to avoid.

---

### 12. A standard set for a section the taxonomy does not name

A named section's card said "Nothing filed here yet. Add the first record to
start this section." and showed nothing under it, while the five each showed six
file faces of what they hold. So the one kind of section a homeowner creates
themselves was the one that taught them nothing.

The five are specific because the architecture doc defines them. A section
someone added is specific to their house and nothing in the app knows what that
is. What is knowable is the paperwork any job leaves behind, so the template is
six document types every trade produces, each carrying the section's own name:
photos, quote, invoice, warranty, permit, receipts, as IMG, PDF and XLS. Two
rows of three, so a named section stands the same height as the five beside it.

The copy changes with it. The five say "This section holds"; a named one says "A
section like this usually holds", because it is a template rather than a
definition.

`SectionFileGrid` now takes the category rather than one of the five codes,
which is what let the same component serve both.

---

### 10. The date field, in the app's own clothes

`<input type="date">` draws a calendar indicator the page has no say over: the
platform's glyph, in the platform's colour, on the platform's inset. The select
had the same problem and the codebase already had the answer — turn the native
furniture off, draw ours on the field's own padding — so this is that, one field
along.

One wrinkle the select did not have. The native picker can only be opened from
that indicator, and `showPicker()` is not everywhere yet, so hiding it would
have taken the picker with it. It is stretched over the whole field instead at
zero opacity: the control opens the way the platform intends, from anywhere on
it, and looks like the rest of the form while doing it.

### 11. The submit button always submits

A greyed-out button is the one answer that explains nothing: the reader is told
no and left to audit their own form for the reason. Worse on these three, which
are a page tall, so the field holding it up is often not on screen when the
button is.

All three now submit on every click. A click that cannot go through spends
itself saying what is missing and putting the reader in front of it: focus moves
to the first unmet field, it scrolls to the middle of the view, and the reason
appears in the form's own error line, in the homeowner's words rather than the
field's name. Typing in that field clears the message.

The field marks itself too. A sentence at the foot of a page-tall form is easy
to read and still not know which box it meant, and focus is spent the moment the
reader clicks anywhere else — often on the way to reading the message. So the
control takes a red hairline and `aria-invalid` until it is touched: a single
box for an input or a select, and a ring standing off the edge for a set of
controls like the chip group or the drop zone, where a border round the lot
would read as a box that appeared from nowhere.

`firstProblem` and `revealProblem` in `shared/utils/formProblems.ts` are the
shared half, with `invalidIf`, `GROUP_INVALID_CLASS` and `FormNote` in
`FormField`. Rules are listed in the order the fields are read, so filling them
in walks down the page.

Buttons are still disabled for what a click cannot fix: a run already in flight,
packing, or no wallet to file with. Not being filled in yet is what the click is
for.

---

## Planned, not started

Nothing asked for. Everything in this round is done; the last six sit in the
working tree waiting to be committed.

### Worth doing next: one shell for the three forms

Not asked for, and the largest duplication left in the app. Filing a record,
starting a project and adding a section are three copies of the same shell: the
same entrance, the same dialog wrapper, the same floating header bar, the same
scroller, the same well, the same two-column grid, the same footer bar. Only the
title, the fields and the actions differ.

This round edited all three in lockstep four times — the gutter, the measure,
the well, the note line — and each pass was three near-identical edits with
three chances to miss one. One of them did get missed: an add-section field lost
its ref to a reformat and the form would have pointed at nothing.

A `FullPageForm` taking title, subtitle, note, actions and children would leave
each form as its fields alone. Held back from this batch deliberately: it is a
structural change across three of the largest files in the app, and there is no
way to see the result short of running the app, which does not boot headless
here.
