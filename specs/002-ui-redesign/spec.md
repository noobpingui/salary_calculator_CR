# Spec 002 — Minimalist, dynamic, monochrome calculator UI

- **Feature:** `002-ui-redesign` · **Type:** feature
- **Scopes:** `app`

## 1. Context and problem

Feature `001-net-salary` turned the app into a working net salary calculator: the user types a gross monthly salary,
presses "Calcular" and sees a breakdown of the mandatory deductions and the net salary. The interface is still the
bare skeleton: a stacked label, input and button, a plain list of amounts, and a red error message. The user finds it
"plain and not dynamic at all".

This feature redesigns the interface so it is **minimalist but well designed**, feels **more dynamic** (it reacts to
what the user types and moves smoothly between states), and uses a **strictly monochrome palette**: black, greys and
white only. No purple, green, yellow, red or any other hue, including for errors, focus and hover.

The redesign changes **how** things look and when they update. It does **not** change **what** is calculated or
shown: amounts, labels, their order, the legal year note and the error messages all stay exactly as defined in
`specs/001-net-salary/spec.md` (REQ-001 to REQ-006 and section 6). The privacy guarantee of 001 (NFR-001) stays in
force.

## 2. User story

As an **employee in Costa Rica (or an employer or accountant acting for one)**, I want **a clean, calm, black-and-white
calculator that updates the breakdown as I type and makes the net salary stand out** so that **I can explore
different gross salaries quickly and read the result at a glance on any device**.

## 3. Scope

**Included:**
- A new visual design for the whole page (heading, form, result, error and empty states) using only achromatic colors.
- Live recalculation: the result updates while the user types, without pressing "Calcular".
- Keeping an explicit "Calcular" button and Enter-to-submit.
- An empty state shown before any value is entered.
- A clear visual hierarchy of the result, with "Salario neto" as the most prominent amount.
- Error presentation that does not rely on color.
- Short, subtle transitions (result reveal/update, hover and focus), disabled when the user prefers reduced motion.
- Light and dark color schemes that follow the operating system preference, both monochrome.
- Accessibility (visible keyboard focus, contrast, reduced motion) and responsive layout down to small phones.

**Out of scope:**
- Any change to the calculation, rounding, legal parameters, breakdown labels, breakdown order, legal year note or
  error messages defined in 001.
- New inputs or calculation options (tax credits, other periods, reverse calculation).
- Copy-to-clipboard, share, print, export or history of results (Q1).
- Animated "count-up" of amounts (Q1).
- A manual light/dark toggle or any remembered preference (Q5).
- Formatting the input with thousand separators while typing; accepted input formats stay as in 001 (Q10).
- Web fonts loaded from a third-party CDN or bundled font files (Q4).
- New text other than the empty-state hint (Q6, Q11).

## 4. Functional requirements

ACs marked **[DOM]** check behavior that only exists in the rendered page (events, focus, what the result area
contains). As decided in Q9, they are automated with a DOM test environment that the plan adds through an explicit task
(Art. P1.3); only AC-N003.2 may remain a manual check if it cannot be automated reliably. ACs marked **[static]** are checked by tests that read the source of the stylesheet and markup as text,
like the existing privacy test. ACs with no mark are checked through the pure presentation logic in the `node`
environment.

### REQ-001 — Monochrome palette
THE SYSTEM SHALL render every part of the interface (text, backgrounds, borders, dividers, shadows, focus indicators,
hover and active states, error state, text selection and native control accents) using only achromatic colors as
defined in section 6, in both color schemes.

- **AC-001.1 [static]:** Given the project's stylesheets and the page markup (including markup produced by the UI entry point), When every color value they declare is inspected, Then each one is achromatic as defined in section 6 (no value has a hue).
- **AC-001.2 [static]:** Given the project's stylesheets, When the rules that style the error message are inspected, Then the error color is achromatic and the previous red value `#b00020` no longer appears anywhere in the source.
- **AC-001.3 [static]:** Given the project's stylesheets, When searched for chromatic named colors (e.g. `red`, `green`, `blue`, `purple`, `yellow`, `orange`, `pink`, `teal`, `navy`, `crimson`), Then none is used as a color value.

### REQ-002 — Calculation, content and messages unchanged
WHEN a gross salary is entered THE SYSTEM SHALL produce exactly the same amounts, breakdown labels, breakdown order,
legal year note and error messages as defined by feature 001.

- **AC-002.1:** Given a gross salary of `1000000`, When the result is produced, Then it contains, in this order, the labels "Salario bruto", "CCSS — Seguro de Enfermedad y Maternidad (5,50 %)", "CCSS — Invalidez, Vejez y Muerte (4,33 %)", "Banco Popular — LPT (1,00 %)", "Impuesto sobre la renta", "Total de rebajas" and "Salario neto", with the amounts of 001 (₡1 000 000,00; ₡55 000,00; ₡43 300,00; ₡10 000,00; ₡8 200,00; ₡116 500,00; ₡883 500,00 in the existing colón format), and the note "Parámetros legales vigentes: 2026".
- **AC-002.2:** Given the inputs `""`, `abc`, `-1` and `1000.123`, When each is evaluated, Then the error messages are respectively "Ingrese el salario bruto mensual.", "El salario bruto debe ser un número válido.", "El salario bruto no puede ser negativo." and "El salario bruto admite como máximo 2 decimales.".
- **AC-002.3:** Given the test suite of feature 001, When the suite is run after this feature, Then every existing test passes without being modified, skipped or weakened.

### REQ-003 — Live recalculation while typing
WHEN the user changes the value of the gross salary field THE SYSTEM SHALL update the result area to reflect the
current value, without the user pressing "Calcular" (Q1, Q2).

- **AC-003.1 [DOM]:** Given the field is empty, When the user types `1000000`, Then, without submitting, the result area shows the breakdown for 1,000,000.00 from AC-002.1.
- **AC-003.2 [DOM]:** Given the result for `500000` is shown, When the user edits the value to `1000000`, Then the breakdown shown is the one for 1,000,000.00 and none of the amounts for 500,000.00 remain.
- **AC-003.3 [DOM]:** Given the user is typing, When the current value is non-empty and invalid (e.g. `abc`, `-1`, `1000.123`), Then the matching error message from 001 is shown and no breakdown is shown.
- **AC-003.4 [DOM]:** Given a breakdown or an error is shown, When the user clears the field completely while typing, Then the result area returns to the empty state of REQ-005 and no error message is shown.
- **AC-003.5:** Given the same input text, When it is evaluated as a live update and as a submission, Then both produce the same breakdown or the same error message (except the empty value, see REQ-004 and REQ-005).

### REQ-004 — Explicit submit remains available
WHEN the user presses Enter in the field or activates the "Calcular" button THE SYSTEM SHALL evaluate the current value
and show the breakdown or the matching error message, including the error for an empty value (Q3).

- **AC-004.1 [DOM]:** Given the field is empty, When the user activates "Calcular", Then the error "Ingrese el salario bruto mensual." is shown and no breakdown is shown.
- **AC-004.2 [DOM]:** Given the field contains `2000000`, When the user presses Enter in the field, Then the breakdown for 2,000,000.00 is shown (net salary ₡1 642 550,00 in the existing colón format).
- **AC-004.3 [DOM]:** Given the page has just loaded, When the user moves focus with the Tab key only, Then the gross salary field and then the "Calcular" button receive focus, in that order.

### REQ-005 — Empty state
WHILE the gross salary field is empty and no submission of the empty value has been made THE SYSTEM SHALL show, in the
result area, the hint "Ingrese su salario bruto mensual para ver el desglose." and no error message and no breakdown (Q6).

- **AC-005.1 [DOM]:** Given the page has just loaded, When nothing has been typed, Then the result area shows "Ingrese su salario bruto mensual para ver el desglose." and no error message.
- **AC-005.2:** Given an empty or whitespace-only value evaluated as a live update, When the result is produced, Then it is the empty state with the hint text above, not an error.
- **AC-005.3:** Given an empty or whitespace-only value evaluated as a submission, When the result is produced, Then it is the error "Ingrese el salario bruto mensual." (as in 001).

### REQ-006 — Visual hierarchy of the result
WHEN a breakdown is shown THE SYSTEM SHALL present "Salario neto" as the most prominent amount on the page and SHALL
visually separate the deduction lines from the gross salary and from the totals, without adding, removing, duplicating
or reordering breakdown lines and without changing how amounts are written (Q7).

- **AC-006.1 [static]:** Given the project's stylesheets, When the styles applied to the "Salario neto" line are compared with those of the other breakdown lines, Then its amount has a larger font size and a font weight at least as heavy as any other line.
- **AC-006.2:** Given a gross salary of `1000000`, When the result is produced, Then it has exactly seven breakdown lines, "Salario neto" is the last one, and no amount carries an added sign or prefix beyond the existing colón format.
- **AC-006.3 [static]:** Given the project's stylesheets, When the breakdown styles are inspected, Then "Total de rebajas" and "Salario neto" are separated from the lines above them by a visible achromatic divider or spacing rule.

### REQ-007 — Error presentation without color
IF the evaluated value is invalid THEN THE SYSTEM SHALL show the error message of 001 distinguished by a non-color cue
(for example weight, border or a symbol that is not read as part of the message), SHALL mark the field as invalid for
assistive technologies, and SHALL announce the message.

- **AC-007.1 [DOM]:** Given the field contains `abc`, When the value is evaluated, Then the field is exposed to assistive technologies as invalid, and the message "El salario bruto debe ser un número válido." is exposed as an alert.
- **AC-007.2 [DOM]:** Given an error is shown, When the user changes the value to `500000`, Then the field is no longer exposed as invalid and no error message remains.
- **AC-007.3 [DOM]:** Given an error is shown, When the text content of the error element is read, Then it is exactly the message from 001, with no added characters.

### REQ-008 — Subtle motion
WHEN the result area changes (empty state, breakdown or error) and WHEN the user hovers or focuses the field or the
button THE SYSTEM SHALL use short transitions of at most 300 ms, and SHALL NOT animate amounts digit by digit (Q1, Q12).

- **AC-008.1 [static]:** Given the project's stylesheets, When every transition and animation duration (plus delay) is inspected, Then none exceeds 300 ms.
- **AC-008.2 [static]:** Given the project's stylesheets, When inspected, Then at least one transition or animation applies to the result area and at least one applies to the hover or focus state of the field or button.

### REQ-009 — Color schemes follow the operating system
WHERE the operating system or browser prefers a dark color scheme THE SYSTEM SHALL use a dark monochrome scheme (light
text on a black or near-black background); otherwise it SHALL use a light monochrome scheme (dark text on a white or
near-white background). No toggle is offered and no preference is stored (Q5).

- **AC-009.1 [static]:** Given the project's stylesheets, When inspected, Then they define both a light scheme and a dark scheme selected by the user's color scheme preference, and every color in both is achromatic (REQ-001).
- **AC-009.2 [static]:** Given the page source, When searched, Then there is no control to switch schemes and no storage of a scheme preference (see NFR-001).

## 5. Non-functional requirements

### NFR-001 — Privacy and no external resources
THE SYSTEM SHALL keep all salary data in the browser without sending or persisting it (001 NFR-001 unchanged) and
SHALL NOT load any font, stylesheet, script, image or other resource from a third-party origin (Q4).

- **AC-N001.1:** Given the existing privacy tests of 001, When run after this feature, Then they pass unchanged: no network or storage API is referenced under `src/` and none is called while producing a result.
- **AC-N001.2 [static]:** Given the page markup and the project's stylesheets, When searched, Then they contain no reference to an external origin (`http://`, `https://` or protocol-relative `//` URLs) and no remote `@import`.
- **AC-N001.3 [static]:** Given the project's stylesheets, When their font declarations are inspected, Then they use only system font families (no `@font-face` rule).

### NFR-002 — Accessibility
THE SYSTEM SHALL keep keyboard focus visible on every interactive element, respect the user's reduced-motion
preference, and meet WCAG 2.2 level AA contrast in both color schemes.

- **AC-N002.1 [static]:** Given the project's stylesheets, When the focus styles of the field and the "Calcular" button are inspected, Then each has a visible, achromatic keyboard focus indicator, and no rule removes the focus outline without replacing it.
- **AC-N002.2 [static]:** Given the project's stylesheets, When inspected, Then a rule applied under the reduced-motion preference sets transition and animation durations to none or 0 for the whole page.
- **AC-N002.3 [static]:** Given the text and background color pairs used in each color scheme, When their contrast ratio is computed, Then normal text is at least 4.5:1, large text (the net salary amount and the heading) is at least 3:1, and the field border and focus indicator are at least 3:1 against the adjacent background.
- **AC-N002.4 [static]:** Given the page markup, When inspected, Then the document language is still `es-CR`, the field keeps its visible label "Salario bruto mensual (CRC)", and the result area is still a polite live region.

### NFR-003 — Responsive layout
THE SYSTEM SHALL be usable without horizontal scrolling on viewports from 320 px wide up to desktop widths, with touch
targets of at least 44 × 44 px for the field and the button.

- **AC-N003.1 [static]:** Given the project's stylesheets, When the field and "Calcular" button styles are inspected, Then their minimum height is at least 44 px (2.75rem at the default 16 px root size).
- **AC-N003.2 [DOM or manual]:** Given a 320 px wide viewport and a gross salary of `5000000`, When the breakdown is shown, Then the longest label ("CCSS — Seguro de Enfermedad y Maternidad (5,50 %)") and its amount are fully visible without horizontal scrolling.

## 6. Visible data and contracts

**Unchanged from 001 (reference: `specs/001-net-salary/spec.md`, section 6):** the field label
"Salario bruto mensual (CRC)", accepted input formats and validation, the four error messages, the seven breakdown
labels and their order, the colón amount format, the note "Parámetros legales vigentes: 2026", the page title and the
heading "Calculadora de Salario Neto".

**New visible text (Spanish, `es-CR`):**

| Where | Text |
|---|---|
| Result area, empty state (REQ-005) | `Ingrese su salario bruto mensual para ver el desglose.` |

**When the result updates:**

| User action | Field value | Result area shows |
|---|---|---|
| Page load | empty | empty-state hint |
| Typing (live) | empty / only whitespace | empty-state hint |
| Typing (live) | invalid, non-empty | matching 001 error message |
| Typing (live) | valid | 001 breakdown + legal year note |
| Enter or "Calcular" | empty / only whitespace | `Ingrese el salario bruto mensual.` |
| Enter or "Calcular" | invalid, non-empty | matching 001 error message |
| Enter or "Calcular" | valid | 001 breakdown + legal year note |

**Achromatic color (REQ-001):** a color whose red, green and blue channels are equal once resolved; any opacity is
allowed. Accepted forms include hex values with equal channels (`#000`, `#fff`, `#1a1a1a`, `#7777`), `rgb()`/`rgba()`
with equal channels, `hsl()`/`hsla()` with 0 % saturation, `oklch()`/`lch()` with 0 chroma, and the keywords `black`,
`white`, `gray`/`grey` and their named shades (`silver`, `gainsboro`, `whitesmoke`, `lightgray`, `darkgray`, `dimgray`
and the `grey` spellings), `transparent`, `currentColor` and `inherit`. Any other value is chromatic.

**Typography:** system font families only; no third-party or bundled web fonts (Q4).

**Motion:** transitions of at most 300 ms; none when the user prefers reduced motion.

## 7. Open questions

| # | Question | Default proposal | User's answer |
|---|---|---|---|
| Q1 | What does "more dynamic" mean for this feature? | Live recalculation as the user types (REQ-003), a short fade/slide when the result appears or changes, and hover/focus transitions on the field and button (REQ-008). No animated count-up of amounts and no copy-to-clipboard or share buttons. | accept all |
| Q2 | With live recalculation, what should appear while the value is empty or invalid mid-typing? | Empty (or whitespace only): show the empty-state hint, no error. Invalid and non-empty (e.g. `-`, `abc`, `1000.123`): show the matching 001 error immediately. The "Ingrese el salario bruto mensual." error only appears on an explicit submit. | accept all |
| Q3 | Should the "Calcular" button stay now that the result updates live? | Yes: keep the "Calcular" button and Enter-to-submit, for keyboard users and for users who expect a button. | accept all |
| Q4 | Fonts: load a web font from a third-party CDN, bundle a font with the app, or use system fonts? | System fonts only. A CDN would contact a third party on every visit (against the privacy intent of 001 NFR-001), and bundling adds weight for little gain in a minimalist design. | accept all |
| Q5 | Dark mode: none, follow the OS, or offer a toggle? | Follow the OS/browser preference with a light and a dark monochrome scheme; no toggle, since remembering a choice would need storage. | accept all |
| Q6 | Should the result area show something before any input, and with what text? | Yes: "Ingrese su salario bruto mensual para ver el desglose." | accept all |
| Q7 | How should the net salary stand out? Should it be repeated as a large headline above the breakdown, or deductions shown with a minus sign? | Emphasize the existing "Salario neto" line (larger, heavier, separated by a divider) without duplicating it, and keep amounts written exactly as in 001, with no minus signs. | accept all |
| Q8 | Should the error state use any color at all (e.g. a dark red) for clarity? | No: strictly achromatic, as the idea asks. Errors are distinguished by weight/border or a symbol and exposed as invalid/alert to assistive technologies (REQ-007). | accept all |
| Q9 | ACs marked [DOM] test rendered-page behavior, and Art. P1.3 forbids DOM-dependent tests unless the plan adds a DOM test environment through an explicit task. Should they be automated or checked manually? | Automate them: the plan adds a DOM test environment through an explicit task (allowed by Art. P1.3), because Art. B4.3 requires a test for every AC. Only AC-N003.2 (visual layout at 320 px) may stay a manual check if it cannot be automated reliably. | accept all |
| Q10 | Should the input format the number with thousand separators while typing (e.g. `1 000 000`)? | No: the field accepts the same formats as in 001; live formatting is out of scope. | accept all |
| Q11 | Should the page title, heading or field label change, or should a subtitle be added (e.g. "Costa Rica · rebajas de ley 2026")? | No: keep the current texts; the only new text is the empty-state hint (Q6). | accept all |
| Q12 | Is 300 ms an acceptable upper limit for transitions? | Yes: at most 300 ms, and no motion at all when the user prefers reduced motion. | accept all |

All questions Q1–Q12 are **resolved**: the user accepted every default proposal ("accept all"). The requirements,
acceptance criteria and section 6 above already reflect them: live recalculation with short transitions and no
count-up or clipboard (Q1, Q12), the empty-state hint while typing and the empty error only on submit (Q2, Q6), the
"Calcular" button kept (Q3), system fonts only (Q4), color schemes that follow the OS with no toggle (Q5), the
"Salario neto" line emphasized without duplication or signs (Q7), strictly achromatic errors (Q8), [DOM] ACs automated
through a DOM test environment added by an explicit plan task (Q9), no live input formatting (Q10), and no text changes
other than the hint (Q11).

## 8. Glossary

- **Achromatic:** without hue: black, white or a grey, with any opacity (see section 6).
- **Live recalculation:** updating the result as the field value changes, without submitting the form.
- **Submission:** pressing Enter in the field or activating the "Calcular" button.
- **Empty state:** what the result area shows while the field is empty and nothing has been submitted.
- **Reduced motion:** the user's operating system or browser preference asking for minimal animation.
- **Color scheme:** the light or dark variant of the palette chosen from the user's OS/browser preference.
