# Spec 002 — "Colilla": payslip-style calculator UI on a night desk

- **Feature:** `002-ui-redesign` · **Type:** feature
- **Scopes:** `app`
- **Revision:** 2 (rework after the user rejected the monochrome design; see section 9, Changelog)

> Note: the feature title in `state.json` still reads "…black, grey and white interface". That title is out of date:
> colour is now allowed and the approved look is the "Colilla" night-desk design below. The orchestrator should update
> the title through the `sdd-state` CLI.

## 1. Context and problem

Feature `001-net-salary` made the app a working net salary calculator. Revision 1 of this feature restyled it in
strict black, grey and white. The user saw that design running and rejected it as flat. They then picked a visual
direction from clickable mockups. The approved visual target is `specs/002-ui-redesign/mockup.html`, panel
"Colilla", variant `dk-paper` ("night desk, paper"). That file is the design contract for this feature.

The idea: the result is a **printed payslip ("colilla de pago")** that comes out of a slot on a desk. The page is
a deep night-teal desk. On the left, a friendly form asks "¿Cuánto le queda de su salario?". On the right, a dimmed
paper slip in a typewriter face lists the gross salary, each mandatory deduction, the total and the net salary, with
dotted leaders, dashed rules and a double rule above the net salary. When the result changes, the slip "prints"
(slides out of the slot). That is the one motion moment on the page.

What stays as it is: the calculation (001), live recalculation while typing, submitting with Enter or the button,
the empty state, the 001 error messages with accessible error semantics, privacy (nothing leaves the browser or is
persisted), accessibility, and a responsive layout down to 320 px.

## 2. User story

As an **employee in Costa Rica (or an employer or accountant acting for one)**, I want **to type my gross monthly
salary and see a clear, payslip-style breakdown of what the law deducts and what I keep** so that **I can understand
my net salary at a glance, on any device, in a way that feels familiar and pleasant**.

## 3. Scope

**Included:**
- A single visual look, "Colilla, night desk, paper" (palette in section 6). It is the same whatever the operating
  system's light or dark preference is.
- Typography: Figtree for the desk (headline, copy, form) and Courier Prime for the paper (field value and slip),
  both served by the app itself (Q13).
- Form column: headline, a short line of copy, the field with a visual `₡` prefix, the error line and the
  "Calcular" button (Q17, Q18).
- Result column: a slot with a paper slip. The slip shows a header, a sub-line with the legal year, the breakdown
  rows with dotted leaders, dashed rules between groups, a double rule above a bold, large "SALARIO NETO", and a
  footer "X % se va en rebajas" (Q14–Q16, Q22).
- The "print" motion when the result changes, disabled under reduced motion (Q21).
- Live recalculation, explicit submit, empty state and accessible errors, as in revision 1.
- Accessibility (contrast, visible focus, touch targets, reduced motion) and a responsive layout from 320 px to
  desktop widths without horizontal scrolling.
- A visual acceptance check: the rendered page is compared with the mockup at 320 px and at desktop width (Q24).

**Out of scope:**
- Any change to the calculation, rounding, legal parameters, input formats, validation or error messages of 001.
- Separate light and dark schemes, a theme toggle or any remembered preference.
- A "Pura Vida" stamp or seal, or any other decoration not in the mockup's Colilla panel.
- A privacy notice line in the slip footer.
- The mockup's other directions ("Billetes", "Selva"), its presentation chrome (top header, tabs, bottom note,
  rounded panel frame) and its prefilled sample salary: the app starts empty (REQ-005).
- New inputs or calculation options, copy/share/print/export, history, animated count-up of amounts, and formatting
  the field with thousand separators while typing.
- Fonts or any other resource loaded from a third-party origin (NFR-001).

## 4. Functional requirements

**How the ACs are checked.** Every AC needs an automated test (Art. B4.3). The marks say which kind:
- no mark: pure presentation logic, run in the `node` environment;
- **[static]**: tests that read the stylesheet(s) and markup as text;
- **[DOM]**: the DOM test environment already added by revision 1 (ADR-0002, Art. P1.3);
- **[browser]**: a real-browser rendering check that needs layout (widths, overflow, screenshots), run locally with
  no network. Q24 proposes how.
- **[visual]**: a screenshot comparison with the mockup that the **user** confirms before approval. The automated
  part (capturing the screenshots) is a [browser] test.

**Rule for amount assertions (review finding F3).** A test that checks an exact amount **MUST NOT** depend on the
group separator character the colón format uses (U+00A0 no-break space or U+0020 space). It builds the expected
string with the app's colón format or normalizes both separators before comparing. The same applies to the space
before `%` in rates and in the deductions share.

**Retired IDs:** REQ-001, REQ-008 and REQ-009 and their ACs are retired (see section 9). They are listed below only
so the numbering stays traceable.

### REQ-001 — Retired (was: monochrome palette)
Replaced by REQ-010. AC-001.1, AC-001.2 and AC-001.3 are retired.

### REQ-002 — Calculation and messages unchanged
WHEN a gross salary is entered THE SYSTEM SHALL compute exactly the same amounts, in the same order, and show exactly
the same error messages as defined by feature 001.

- **AC-002.1:** Given a gross salary of `1000000`, When the result is produced, Then the slip rows, in order, carry
  the amounts of 001: ₡1 000 000,00 (gross); ₡55 000,00; ₡43 300,00; ₡10 000,00; ₡8 200,00 (deductions);
  ₡116 500,00 (total); ₡883 500,00 (net).
- **AC-002.2:** Given the inputs `""` (on submit), `abc`, `-1` and `1000.123`, When each is evaluated, Then the error
  messages are respectively "Ingrese el salario bruto mensual.", "El salario bruto debe ser un número válido.",
  "El salario bruto no puede ser negativo." and "El salario bruto admite como máximo 2 decimales.".
- **AC-002.3:** Given the test suite of feature 001, When it is run after this feature, Then every existing 001 test
  passes without being modified, skipped or weakened.
- **AC-002.4 [DOM]:** Given a gross salary of `1500000`, When the slip is shown, Then the digits and separators of
  every amount are exactly the 001 colón format for that amount, character for character, including its original
  group separator. The only allowed addition is the leading minus sign of REQ-011 (no separator is rewritten for
  display).

### REQ-003 — Live recalculation while typing
WHEN the user changes the value of the gross salary field THE SYSTEM SHALL update the result to reflect the current
value, without the user pressing "Calcular".

- **AC-003.1 [DOM]:** Given the field is empty, When the user types `1000000`, Then, without submitting, the slip
  shows the breakdown of AC-002.1.
- **AC-003.2 [DOM]:** Given the slip for `500000` is shown, When the user edits the value to `1000000`, Then the slip
  shows the breakdown for 1 000 000,00 and none of the amounts for 500 000,00 remain.
- **AC-003.3 [DOM]:** Given the user is typing, When the current value is non-empty and invalid (`abc`, `-1`,
  `1000.123`), Then the matching 001 error message is shown and no slip (breakdown) is shown.
- **AC-003.4 [DOM]:** Given a slip or an error is shown, When the user clears the field completely, Then the empty
  state of REQ-005 is shown and no error message is shown.
- **AC-003.5:** Given the same input text, When it is evaluated as a live update and as a submission, Then both
  produce the same breakdown or the same error message, except for the empty value (REQ-004, REQ-005).

### REQ-004 — Explicit submit remains available
WHEN the user presses Enter in the field or activates the "Calcular" button THE SYSTEM SHALL evaluate the current value
and show the slip or the matching error message, including the error for an empty value.

- **AC-004.1 [DOM]:** Given the field is empty, When the user activates "Calcular", Then the error
  "Ingrese el salario bruto mensual." is shown and no slip is shown.
- **AC-004.2 [DOM]:** Given the field contains `2000000`, When the user presses Enter in the field, Then the slip for
  2 000 000,00 is shown with net salary ₡1 642 550,00.
- **AC-004.3 [DOM]:** Given the page has just loaded, When the user moves focus with the Tab key only, Then the gross
  salary field and then the "Calcular" button receive focus, in that order.

### REQ-005 — Empty state
WHILE the gross salary field is empty and no submission of the empty value has been made THE SYSTEM SHALL show, in the
result column, the hint "Ingrese su salario bruto mensual para ver el desglose.", with no slip and no error message
(Q20).

- **AC-005.1 [DOM]:** Given the page has just loaded, When nothing has been typed, Then the field is empty, the
  result area shows exactly "Ingrese su salario bruto mensual para ver el desglose.", and neither a slip nor an error
  message is shown.
- **AC-005.2:** Given an empty or whitespace-only value evaluated as a live update, When the result is produced, Then
  it is the empty state with exactly the hint text above, not an error.
- **AC-005.3:** Given an empty or whitespace-only value evaluated as a submission, When the result is produced, Then
  it is the error "Ingrese el salario bruto mensual.".

### REQ-006 — Visual hierarchy of the slip
WHEN a slip is shown THE SYSTEM SHALL present "SALARIO NETO" and its amount as the most prominent line, set apart by a
double rule, and SHALL separate the gross salary, the deductions and the total with dashed rules, without adding,
removing, duplicating or reordering amount lines.

- **AC-006.1 [static]:** Given the stylesheet, When the styles of the net salary line are compared with those of the
  other slip rows, Then its amount has a larger font size than any other row amount and a bold weight (700 or more),
  and its label is bold.
- **AC-006.2 [DOM]** *(revised)*: Given a gross salary of `1000000`, When the slip is shown, Then it has exactly
  seven amount lines in the order gross, SEM, IVM, Banco Popular, income tax, total, net, and the net line is last.
- **AC-006.3 [DOM + static]** *(revised)*: Given the slip for `1000000`, When its structure and styles are inspected,
  Then a dashed rule separates the gross row from the first deduction and the last deduction (income tax) from the
  total. A double rule sits directly above the net line. No other rules appear between rows.

### REQ-007 — Accessible error presentation
IF the evaluated value is invalid THEN THE SYSTEM SHALL show the 001 error message directly below the field, SHALL
mark the field as invalid for assistive technologies, SHALL announce the message, and SHALL show no slip (Q19).

- **AC-007.1 [DOM]:** Given the field contains `abc`, When the value is evaluated, Then the field is exposed as
  invalid and linked to the message, and "El salario bruto debe ser un número válido." is exposed as an alert.
- **AC-007.2 [DOM]:** Given an error is shown, When the user changes the value to `500000`, Then the field is no longer
  exposed as invalid and no error message remains.
- **AC-007.3 [DOM]:** Given an error is shown, When the text content of the error element is read, Then it is exactly
  the 001 message, with no added characters.
- **AC-007.4 [DOM]:** Given the field contains `-1`, When the value is evaluated, Then the error message is in the form
  column, after the field and before the "Calcular" button in document order, and the result area contains no slip.

### REQ-008 — Retired (was: subtle motion of at most 300 ms)
Replaced by REQ-013. AC-008.1 and AC-008.2 are retired.

### REQ-009 — Retired (was: colour schemes follow the operating system)
Replaced by REQ-010 (single look). AC-009.1 and AC-009.2 are retired; the "no toggle, no stored preference" guarantee
moves to AC-010.4.

### REQ-010 — Single "Colilla, night desk, paper" look
THE SYSTEM SHALL render the page with the "night desk, paper" palette and the typography of section 6, and SHALL use
this same look whatever the user's light or dark preference is.

- **AC-010.1 [static]:** Given the stylesheet, When its colour declarations are inspected, Then it defines the desk
  `#0b2624`, the desk glow `#133b38`, the paper `#e9e3d3`, the paper ink `#1f2826`, the muted paper ink `#545f5c`
  (Q23; the original mockup value `#5f6b68` is not used), the focus ring `#f2c14e` and the error text `#ffd08a` (Q19).
  The desk (with the glow) is the page background and the paper colour is the slip and field background.
- **AC-010.2 [static]:** Given the stylesheet and the page markup, When searched, Then there is no rule or attribute
  selected by the colour scheme preference (`prefers-color-scheme`). The page declares a single theme colour
  (`#0b2624`) and a single colour scheme for native controls.
- **AC-010.3 [browser]:** Given the page with a gross salary of `1500000`, When it is rendered once with a light
  colour scheme preference and once with a dark one, Then both renderings are pixel-identical.
- **AC-010.4 [static]:** Given the page source, When searched, Then there is no control to switch looks or schemes
  and no stored preference.
- **AC-010.5 [static]:** Given the stylesheet, When the font families are inspected, Then the headline, copy, label,
  button and error use Figtree, and the field value and the whole slip use Courier Prime. Each has a generic fallback
  (`sans-serif` or `monospace`).
- **AC-010.6 [DOM]:** Given the page with a slip shown, When its text is searched, Then it contains no "Pura Vida"
  text, stamp or seal.

### REQ-011 — Payslip ("colilla") result
WHEN a valid value is evaluated THE SYSTEM SHALL show the result as a paper slip with, in this order: the header
"COLILLA DE PAGO", the sub-line "Estimación mensual · parámetros <year>", the gross row, a dashed rule, the four
deduction rows, a dashed rule, the total row, a double rule, the "SALARIO NETO" line and the footer
"<share> se va en rebajas". Each row shows its label, a dotted leader and its amount (texts in section 6; Q14–Q16).

- **AC-011.1:** Given a gross salary of `1000000`, When the slip content is produced, Then the header is
  "COLILLA DE PAGO", the sub-line is "Estimación mensual · parámetros 2026", and the row labels in order are
  "Salario bruto", "CCSS SEM" with rate "5,50 %", "CCSS IVM" with rate "4,33 %", "Banco Popular" with rate "1,00 %",
  "Impuesto renta", "Total rebajas" and "SALARIO NETO".
- **AC-011.2:** Given a gross salary of `1000000`, When the slip content is produced, Then the five deduction and
  total amounts are written with a leading minus sign "−" (U+2212) followed by the 001 colón format (e.g.
  "−₡55 000,00"). The gross and net amounts have no sign.
- **AC-011.3:** Given legal parameters for a year other than 2026 (a test fixture) or with different rates, When the
  slip content is produced, Then the sub-line shows that year and the rate labels show those rates. Neither is fixed
  text.
- **AC-011.4 [DOM]:** Given the slip for `1500000`, When its rows are inspected, Then each of the seven amount rows
  shows its label, then a leader element, then its amount. The leader is not exposed to assistive technologies and
  adds no text to the row.
- **AC-011.5 [static]:** Given the stylesheet, When the slip rules are inspected, Then the leaders are dotted, the group
  rules are dashed and the rule above the net line is double.
- **AC-011.6 [DOM]:** Given the slip for `1500000`, When the footer is read, Then it is exactly
  "15,2 % se va en rebajas" (separator-agnostic before `%`), and no privacy notice line appears in the slip.

### REQ-012 — Share of gross that goes to deductions
WHEN a slip is shown THE SYSTEM SHALL compute the total deductions as a percentage of the gross salary, rounded half up
to one decimal from the exact amounts, and SHALL write it in es-CR format with a decimal comma, a space and `%`
(Q22).

- **AC-012.1:** Given the gross salaries `1500000`, `1000000`, `2000000` and `500000`, When the share is produced, Then
  it is respectively "15,2 %", "11,7 %", "17,9 %" and "10,8 %".
- **AC-012.2:** Given a gross salary of `1000000` (deductions ₡116 500,00, exactly 11,65 %), When the share is
  produced, Then the half is rounded up to "11,7 %", not down because of binary floating point.
- **AC-012.3:** Given a gross salary of `0`, When the share is produced, Then it is "0,0 %" and no error is shown.
- **AC-012.4:** Given a share that rounds to a whole number (e.g. deductions exactly 10 % of gross in a fixture),
  When it is written, Then it keeps one decimal ("10,0 %").

### REQ-013 — The slip "prints"
WHEN the slip appears or its amounts change THE SYSTEM SHALL play a single "print" motion in which the slip slides
down out of the slot and is revealed from the top, lasting at most 600 ms. No other element SHALL move (Q21).

- **AC-013.1 [DOM]:** Given the empty state, When the user types `1500000`, Then the slip is marked to play the print
  motion.
- **AC-013.2 [DOM]:** Given the slip for `1000000` is shown, When the value changes to `1000000.0` (same amounts),
  Then the print motion is not replayed. When it then changes to `1500000`, Then it is replayed.
- **AC-013.3 [DOM]:** Given the slip for `2000000` is shown, When the user presses Enter or activates "Calcular" with
  the same value, Then the print motion is replayed.
- **AC-013.4 [static]:** Given the stylesheet, When animations and transitions are inspected, Then the only animation
  is the slip's print, its duration plus delay is at most 600 ms, and every other transition lasts at most 200 ms and
  only changes colour, border colour, shadow or outline (never position, size or transform).
- **AC-013.5 [static]:** Given the stylesheet, When the rules applied under the reduced-motion preference are
  inspected, Then all animations and transitions are disabled for the whole page, so the slip appears at once.

### REQ-014 — Form column content
THE SYSTEM SHALL show, in the form column and in this order: the headline "¿Cuánto le queda de su salario?", the copy
line "Escriba su salario bruto mensual y le imprimimos la colilla con cada rebaja de ley.", the label "Salario bruto
mensual", the field on a paper background with a decorative `₡` prefix, the error line and the "Calcular" button
(Q17, Q18).

- **AC-014.1 [DOM]:** Given the page has loaded, When its text is read, Then the main heading (level 1) is exactly
  "¿Cuánto le queda de su salario?", followed by the copy line above, and the document title is still
  "Calculadora de Salario Neto - Costa Rica".
- **AC-014.2 [DOM]:** Given the page has loaded, When the field is inspected, Then its visible label is
  "Salario bruto mensual", its accessible name starts with that text, and the `₡` prefix is visible but is neither part
  of the field value nor exposed to assistive technologies.
- **AC-014.3 [DOM]:** Given the page has loaded, When the form is inspected, Then it has exactly one field and one
  submit button labelled "Calcular".
- **AC-014.4 [static]:** Given the stylesheet, When the "Calcular" button styles are inspected, Then its background is
  the paper colour `#e9e3d3`, its text is the paper ink `#1f2826`, and its keyboard focus indicator uses the focus ring
  colour `#f2c14e` (Q18).

### REQ-015 — Desk layout and visual match with the mockup
THE SYSTEM SHALL lay out the page as a desk that fills the viewport: at wide viewports, the form column on the left and
the slot with the slip on the right (at most 420 px wide); at narrow viewports, a single column with the form above the
slot. The slot is a dark bar the slip comes out of, and the slip's bottom edge is torn (zigzag), as in the mockup.

- **AC-015.1 [browser]:** Given a 1280 × 800 viewport and a gross salary of `1500000`, When the page is rendered, Then
  the form column and the slip are side by side, form on the left, and the slip is at most 420 px wide.
- **AC-015.2 [browser]:** Given a 320 × 640 viewport and a gross salary of `1500000`, When the page is rendered, Then
  there is a single column with the form above the slot and slip.
- **AC-015.3 [visual]:** Given screenshots of the rendered page at 320 × 640 and at 1280 × 800 (gross `1500000`, and
  the empty state at 1280 × 800), When the user compares them side by side with the mockup's Colilla `dk-paper`
  panel at the same widths, Then the user confirms that the composition matches. That covers the desk and glow, the
  column arrangement, the headline and copy, the paper field with `₡`, the slot bar, the slip with header, leaders,
  dashed and double rules, the torn bottom edge, the large net salary and the footer. The screenshots are captured by
  an automated [browser] test and the confirmation is recorded in the verify report before approval.

## 5. Non-functional requirements

### NFR-001 — Privacy and no external resources
THE SYSTEM SHALL keep all salary data in the browser without sending or persisting it (001 NFR-001 unchanged) and SHALL
NOT load any font, stylesheet, script, image or other resource from a third-party origin. The fonts are served from the
app's own files (Q13).

- **AC-N001.1:** Given the existing 001 privacy tests, When run after this feature, Then they pass unchanged: no
  network or storage API is referenced under `src/` and none is called while producing a result.
- **AC-N001.2 [static]:** Given the page markup and the stylesheets, When searched, Then they contain no reference to
  an external origin (`http://`, `https://` or protocol-relative `//` URLs), no remote `@import` and no preconnect to a
  font service. The mockup's Google Fonts links are not carried over.
- **AC-N001.3** — Retired (was: system fonts only, no `@font-face`). Replaced by AC-N001.4.
- **AC-N001.4 [static]:** Given the stylesheets, When the font-face declarations are inspected, Then they declare only
  Courier Prime and Figtree, and every font source is a relative path to a font file inside the project, which exists.
- **AC-N001.5 [static]:** Given the project, When the bundled font files are listed, Then each family's licence (SIL
  Open Font License) text is included next to them.

### NFR-002 — Accessibility
THE SYSTEM SHALL keep keyboard focus visible on every interactive element, respect the reduced-motion preference, and
meet WCAG 2.2 level AA contrast for text and for the boundaries of interactive elements.

- **AC-N002.1 [static]** *(revised)*: Given the stylesheet, When the focus styles of the field and the "Calcular"
  button are inspected, Then each has a visible keyboard focus indicator (the mockup uses a `#f2c14e` ring around the
  field). No rule removes the focus indicator of an element without an equivalent replacement on that element or its
  container.
- **AC-N002.2 [static]:** Given the stylesheet, When inspected, Then a rule applied under the reduced-motion preference
  disables transition and animation for the whole page (same check as AC-013.5).
- **AC-N002.3 [static]** *(revised)*: Given the colour pairs of section 6, When their contrast ratios are computed, Then:
  normal text is at least 4.5:1 (desk ink and desk muted on desk and glow, warning on desk and glow, paper ink and
  paper muted on paper, button text on button); large text (headline, net amount) is at least 3:1; the field's paper
  surface, the button boundary and the focus indicator are at least 3:1 against the adjacent desk colour. Dotted
  leaders, dashed rules and the slot bar are decorative and exempt.
- **AC-N002.4 [DOM]** *(revised)*: Given the page markup, When inspected, Then the document language is `es-CR`, the
  field has the visible label of AC-014.2, the result area is a polite live region, and decorative elements (the `₡`
  prefix, leaders, rules, slot bar) are hidden from assistive technologies.

### NFR-003 — Responsive layout
THE SYSTEM SHALL be usable without horizontal scrolling on viewports from 320 px wide up to desktop widths, SHALL never
split an amount across lines, and SHALL give the field and the button touch targets of at least 44 × 44 px (Q25).

- **AC-N003.1 [static]:** Given the stylesheet, When the field and "Calcular" button styles are inspected, Then their
  minimum height is at least 44 px (2.75rem at a 16 px root size).
- **AC-N003.2 [browser]** *(revised)*: Given a 320 × 640 viewport, When the page is rendered with gross salaries
  `5000000` and `100000000`, Then the page has no horizontal overflow, every slip row and the net amount are fully
  visible, and no amount is broken across lines.
- **AC-N003.3 [browser]:** Given viewports of 320, 375, 768, 1024 and 1440 px wide, When the page is rendered with gross
  `1500000`, Then none has horizontal overflow.

## 6. Visible data and contracts

**Unchanged from 001** (`specs/001-net-salary/spec.md`, section 6): accepted input formats and validation, the four
error messages, the calculation and rounding, the colón amount format (`es-CR`, `₡`, two decimals) and the page title
"Calculadora de Salario Neto - Costa Rica".

**Form column (Spanish, `es-CR`):**

| Element | Text |
|---|---|
| Main heading | `¿Cuánto le queda de su salario?` |
| Copy line | `Escriba su salario bruto mensual y le imprimimos la colilla con cada rebaja de ley.` |
| Field label | `Salario bruto mensual` |
| Field prefix (decorative) | `₡` |
| Error line | the matching 001 message |
| Button | `Calcular` |

**Result column:**

| State | Shows |
|---|---|
| Empty (REQ-005) | the hint `Ingrese su salario bruto mensual para ver el desglose.` below the empty slot, no slip |
| Error (REQ-007) | the empty slot, no slip, no hint (the message is in the form column) |
| Valid value | the slip |

**Slip content, in order (example: gross `1500000`):**

| # | Label | Muted rate | Amount |
|---|---|---|---|
| — | `COLILLA DE PAGO` (header, centred, bold) | | |
| — | `Estimación mensual · parámetros 2026` (sub-line, centred, muted) | | |
| 1 | `Salario bruto` | | `₡1 500 000,00` |
| — | dashed rule | | |
| 2 | `CCSS SEM` | `5,50 %` | `−₡82 500,00` |
| 3 | `CCSS IVM` | `4,33 %` | `−₡64 950,00` |
| 4 | `Banco Popular` | `1,00 %` | `−₡15 000,00` |
| 5 | `Impuesto renta` | | `−₡65 850,00` |
| — | dashed rule | | |
| 6 | `Total rebajas` | | `−₡228 300,00` |
| — | double rule | | |
| 7 | `SALARIO NETO` (bold) | | `₡1 271 700,00` (bold, large) |
| — | `15,2 % se va en rebajas` (footer, centred, muted) | | |

Rows 1–6 have a dotted leader between the label and the amount. The year and rates come from the legal parameters in
force. The minus sign is U+2212. Group separators are whatever the 001 colón format produces.

**Deductions share:** `total deductions ÷ gross × 100`, computed from the exact amounts, rounded half up to one
decimal, written with a decimal comma, a space and `%` (e.g. `15,2 %`). For a gross of 0 it is `0,0 %`.

**Palette (from the mockup's `dk-paper` variant; single look):**

| Role | Colour |
|---|---|
| Desk (page background) | `#0b2624` |
| Desk glow (radial, top left) | `#133b38` |
| Desk ink (headline, copy) | `#dfeee9` |
| Desk muted (label, hint) | `#8fb3aa` |
| Slot bar | `#051312` |
| Paper (slip, field) | `#e9e3d3` |
| Paper ink | `#1f2826` |
| Paper muted (sub-line, rates, footer, `₡`) | `#545f5c` (about 5.2:1 on the paper; darker than the original mockup's `#5f6b68`, Q23) |
| Leader dots | `#a9b0a8` |
| Dashed rules | `#8b958f` |
| Focus ring | `#f2c14e` |
| Error text | `#ffd08a` |

**Typography:** Figtree (400, 500, 700) for the desk; Courier Prime (400, 700) for the field value and the slip. Both
are self-hosted (Q13).

**Composition reference:** `specs/002-ui-redesign/mockup.html`, panel "Colilla" with class `dk-paper`, including its
layout below 760 px (one column). The mockup is being updated to show the "Calcular" button, the error and empty
states (Q18–Q20) and the darker muted paper ink `#545f5c` (Q23); the updated version is the reference for AC-015.3. Only that panel is the contract. The mockup's header, tabs, bottom note, rounded
panel frame, sample value, script and external font links are not part of the design.

**When the result updates:**

| User action | Field value | Result column shows | Print plays |
|---|---|---|---|
| Page load | empty | empty-state hint | no |
| Typing (live) | empty / only whitespace | empty-state hint | no |
| Typing (live) | invalid, non-empty | error below the field, no slip | no |
| Typing (live) | valid, amounts differ from the slip shown | slip | yes |
| Typing (live) | valid, same amounts as the slip shown | slip (unchanged) | no |
| Enter or "Calcular" | empty / only whitespace | `Ingrese el salario bruto mensual.` below the field, no slip | no |
| Enter or "Calcular" | invalid, non-empty | error below the field, no slip | no |
| Enter or "Calcular" | valid | slip | yes |

**Motion:** the print is at most 600 ms. Other transitions are colour-only and at most 200 ms. Nothing moves under
reduced motion.

## 7. Open questions

All questions are **resolved**. Q1–Q12 were answered in revision 1; the ones marked "superseded" no longer apply, and
the newer question replaces them. For Q13–Q25 the user accepted every default proposal ("accept all defaults"), and
the requirements, acceptance criteria and section 6 reflect them.

| # | Question | Default proposal | User's answer |
|---|---|---|---|
| Q1 | What does "more dynamic" mean for this feature? | Live recalculation as the user types (REQ-003), a short fade/slide when the result appears or changes, and hover/focus transitions on the field and button (REQ-008). No animated count-up of amounts and no copy-to-clipboard or share buttons. *(Motion part superseded by Q21.)* | accept all |
| Q2 | With live recalculation, what should appear while the value is empty or invalid mid-typing? | Empty (or whitespace only): show the empty-state hint, no error. Invalid and non-empty (e.g. `-`, `abc`, `1000.123`): show the matching 001 error immediately. The "Ingrese el salario bruto mensual." error only appears on an explicit submit. | accept all |
| Q3 | Should the "Calcular" button stay now that the result updates live? | Yes: keep the "Calcular" button and Enter-to-submit, for keyboard users and for users who expect a button. | accept all |
| Q4 | Fonts: load a web font from a third-party CDN, bundle a font with the app, or use system fonts? | System fonts only. *(Superseded by Q13.)* | accept all |
| Q5 | Dark mode: none, follow the OS, or offer a toggle? | Follow the OS/browser preference with a light and a dark monochrome scheme; no toggle. *(Superseded by the user's rework decision: a single look, REQ-010.)* | accept all |
| Q6 | Should the result area show something before any input, and with what text? | Yes: "Ingrese su salario bruto mensual para ver el desglose." | accept all |
| Q7 | How should the net salary stand out? Repeat it as a headline, or show deductions with a minus sign? | Emphasize the existing "Salario neto" line without duplicating it, and no minus signs. *(Superseded by Q15 and REQ-006/REQ-011.)* | accept all |
| Q8 | Should the error state use any colour? | No: strictly achromatic. *(Superseded: colour is now allowed; see Q19.)* | accept all |
| Q9 | Should the [DOM] ACs be automated or checked manually? | Automate them with a DOM test environment added through an explicit plan task. *(Extended by Q24 for [browser] and [visual].)* | accept all |
| Q10 | Should the input format the number with thousand separators while typing? | No: the field accepts the same formats as in 001. | accept all |
| Q11 | Should the page title, heading or field label change, or should a subtitle be added? | No. *(Superseded by Q16 and Q17.)* | accept all |
| Q12 | Is 300 ms an acceptable upper limit for transitions? | Yes. *(Superseded by Q21.)* | accept all |
| Q13 | The mockup loads Courier Prime and Figtree from Google Fonts, but NFR-001 forbids third-party resources. How should the fonts be provided? | Self-host them: bundle the font files (Courier Prime 400/700, Figtree 400/500/700, Latin subset) with the app so the build serves them from the same origin, include their SIL OFL licence, and declare `monospace`/`sans-serif` fallbacks. No request to Google or any other third party (AC-N001.2, AC-N001.4, AC-N001.5). | accept all defaults |
| Q14 | The mockup's slip uses short labels ("CCSS SEM", "CCSS IVM", "Banco Popular", "Impuesto renta", "Total rebajas", "SALARIO NETO") with the rate in muted text, while 001 shows full labels ("CCSS — Seguro de Enfermedad y Maternidad (5,50 %)", etc.). Which should the slip use? | Follow the mockup: short labels with the rate in muted text, as in section 6. They fit the payslip style and the 320 px width. The 001 calculation and its tests are unchanged. | accept all defaults |
| Q15 | The mockup shows deductions and the total with a leading minus sign ("−₡82 500,00"); revision 1 said no signs (Q7). Keep the minus sign? | Yes, as in the mockup: U+2212 before the five deduction and total amounts. Gross and net have no sign (AC-011.2). | accept all defaults |
| Q16 | The slip has a header "COLILLA DE PAGO" and a sub-line "Estimación mensual · parámetros 2026". Should the sub-line replace the 001 note "Parámetros legales vigentes: 2026"? | Yes: show the header and the sub-line as in the mockup. The sub-line carries the legal year, so the separate 001 note is no longer shown. | accept all defaults |
| Q17 | Headline, title and label: should "¿Cuánto le queda de su salario?" replace the visible heading "Calculadora de Salario Neto", and should the label become "Salario bruto mensual" with a `₡` prefix instead of "Salario bruto mensual (CRC)"? | Yes to both, as in the mockup. The headline is the page's main heading, the document title stays "Calculadora de Salario Neto - Costa Rica", and the `₡` prefix is decorative (hidden from assistive technologies). | accept all defaults |
| Q18 | The mockup has no "Calcular" button, but the button must stay. Where and how should it appear? | In the form column below the field and the error line, labelled "Calcular", at least 44 px tall, in the paper and ink colours (paper background, dark ink text) with the same amber focus ring. Its exact look is confirmed with the screenshots of AC-015.3. | accept all defaults |
| Q19 | On an invalid value the mockup keeps the previous slip on screen and shows the error in amber below the field. What should the result column show during an error? | Error text in `#ffd08a` directly below the field (as in the mockup), and **no** slip: the slot stays empty, as 001 and revision 1 required ("no breakdown on error"). Showing an outdated slip next to an error could be misread. | accept all defaults |
| Q20 | The mockup has no empty state (it starts with a sample value). Where does the hint go? | The app starts with an empty field. The result column shows the empty slot bar with the hint "Ingrese su salario bruto mensual para ver el desglose." below it, in desk-muted colour, and no slip. | accept all defaults |
| Q21 | When exactly should the slip "print", and how long may it take? The mockup reprints on every keystroke and lasts 550 ms, above revision 1's 300 ms limit. | The print plays when the slip appears or its amounts change (restarting if one is still running), and on every Enter or "Calcular" with a valid value. It does not replay when live typing gives the same amounts (e.g. `1000000` → `1000000.0`). At most 600 ms. It is the only animation; hover and focus changes are colour-only, at most 200 ms. Nothing moves under reduced motion. | accept all defaults |
| Q22 | How exactly is "X % se va en rebajas" computed and written? | Total deductions ÷ gross × 100 from the exact amounts, rounded half up to one decimal, always one decimal, decimal comma, a space before `%` (e.g. "15,2 %", "11,7 %", "10,0 %"). For a gross of 0 it shows "0,0 %". | accept all defaults |
| Q23 | The mockup's muted paper ink `#5f6b68` on the paper `#e9e3d3` is about 4.3:1, below the 4.5:1 AA minimum for the small sub-line, rates and footer. How should this be fixed? | Darken only that muted ink until it reaches at least 4.5:1 (e.g. `#545f5c`, about 5.2:1). Everything else stays as in the mockup. | accept all defaults (muted paper ink `#545f5c`) |
| Q24 | Layout checks (320 px, desktop, no horizontal scroll, identical look under light/dark preference) need a real browser, which jsdom is not. How should the [browser] and [visual] ACs be covered? | The plan adds, through an explicit task, a headless-browser test run locally against the built app, with no network. It renders at the listed widths, checks overflow and layout, compares the light and dark preference renders, and saves screenshots at 320 × 640 and 1280 × 800. The user then compares those screenshots with the mockup; that confirmation (AC-015.3) is recorded in the verify report before approval. | accept all defaults |
| Q25 | At 320 px a very large net salary (e.g. from a gross of `100000000`) may not fit on one line at the large size. What should happen? | There is never horizontal page scroll and no amount is split. The net line may put the amount under its label (as the mockup's wrapping net line does) and may reduce its size just enough to fit. This is checked with `5000000` and `100000000` (AC-N003.2). | accept all defaults |

## 8. Glossary

- **Colilla (de pago):** a payslip; here, the paper slip that shows the breakdown.
- **Desk:** the dark night-teal page background on which the form and the slot sit.
- **Slot:** the dark bar the slip comes out of.
- **Print:** the single motion in which the slip slides out of the slot and is revealed.
- **Leader:** the dotted line that joins a row's label and its amount.
- **Deductions share:** total deductions as a percentage of the gross salary, shown in the slip footer.
- **Live recalculation:** updating the result as the field value changes, without submitting.
- **Submission:** pressing Enter in the field or activating the "Calcular" button.
- **Empty state:** what the result column shows while the field is empty and nothing has been submitted.
- **Reduced motion:** the user's operating system or browser preference asking for minimal animation.

## 9. Changelog

**Revision 2 (rework, 2026-09-28).** The user rejected the monochrome design after seeing it and approved the
"Colilla, night desk, paper" mockup (`mockup.html`, `dk-paper`) as the single look. Colour is now allowed.
- **Retired:** REQ-001 (monochrome) with AC-001.1–001.3; REQ-008 (motion ≤ 300 ms) with AC-008.1–008.2; REQ-009 (OS
  light/dark schemes) with AC-009.1–009.2; AC-N001.3 (system fonts only).
- **Revised:** AC-002.1 (amounts only; labels move to REQ-011); AC-002.2 (the empty case is on submit); AC-005.1 (field
  starts empty; exact hint); AC-006.1–006.3 (slip hierarchy: dashed and double rules, bold large net);
  REQ-007 (renamed "Accessible error presentation"; the error is below the field, no slip); AC-N001.2 (no font
  service preconnect); AC-N002.1, AC-N002.3, AC-N002.4 (new palette, decorative elements hidden); AC-N003.2 (now a
  [browser] check with a large amount).
- **Kept as is:** REQ-003, REQ-004, REQ-005 (intent), AC-002.3, AC-003.1–003.5, AC-004.1–004.3, AC-005.2–005.3,
  AC-007.1–007.3, AC-N001.1, AC-N002.2, AC-N003.1.
- **Added:** AC-002.4 (no separator rewriting, review finding F3); AC-007.4; AC-014.4 (button colours, Q18); REQ-010 (single look, fonts, no "Pura
  Vida"); REQ-011 (slip content); REQ-012 (deductions share); REQ-013 (print motion); REQ-014 (form column);
  REQ-015 (desk layout and visual match with the user); AC-N001.4–N001.5 (self-hosted fonts and licence);
  AC-N003.3 (no overflow across widths).
- **Test rule added** (section 4): amount and percentage assertions are separator-agnostic (review F3). This allows
  removing the display-only separator rewrite that revision 1 introduced.
- Q13–Q25 opened and resolved (the user accepted all defaults); Q1, Q4, Q5, Q7, Q8, Q11 and Q12 marked superseded.
  The muted paper ink is `#545f5c` (Q23).
