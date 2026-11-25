# Formatting Rules

> Applies to all user-facing text: UI, marketing, emails.
> Follow the conventions of your project's target locale. Examples below use
> `en-US`, `en-GB`, `de-DE` and `fr-FR` as placeholders; replace them with the
> locale(s) your product actually serves.

---

## Numbers, Currency and Percentages

- **Decimal separator:** follow the locale (`en-US`: `33.15`, `de-DE`/`fr-FR`: `33,15`)
- **Currency symbol:** follow the locale (`en-US`: `$33.15`, `de-DE`: `33,15 €`, `fr-FR`: `33,15 €`)
- **Whole amounts:** omit cents for whole amounts (`41` not `41.00`)
- **Time references:** use consumer-friendly wording (`per month`, not `/month`)
- **Percentages:** follow the locale for spacing (`15%` in `en-US`, `15 %` in `fr-FR`)

### Examples
```
✅ en-US: $33.15 per month
✅ fr-FR: 33,15 € par mois

❌ $33,15 (mixed separators)
❌ 41.00 € (cents on a whole amount)
❌ 33.15 €/month
```

---

## Dashes and Ranges

- **En dash (–, U+2013):** ranges and connections (`9–17 h`, `Vienna–Berlin`)
- **Hyphen (-, U+002D):** compound words only

### Examples
```
✅ 9–17 h
✅ – 15 % discount   (de-DE / fr-FR)
✅ – 15% discount    (en-US)

❌ 9-17 h
❌ -15% discount
```

---

## Quotation Marks

Use the typographic quotes of the target locale:

- **en-US / en-GB:** “Text” (U+201C, U+201D) or ‘Text’ for nested quotes
- **de-DE:** „Text“ (U+201E opening, U+201C closing)
- **fr-FR:** « Texte » (with non-breaking spaces inside)

### Examples
```
✅ en-US: “Welcome to our site.”
✅ fr-FR: « Bienvenue sur notre site. »
❌ "Welcome to our site." (straight quotes in UI copy)
```

---

## Dates

- Use the locale's date format, not ISO (`2026-03-15`) or ambiguous numeric forms in the UI
- **en-US:** `March 15, 2026`
- **en-GB:** `15 March 2026`
- **fr-FR:** `15 mars 2026`

---

## Summary

| Element | Correct (example) | Incorrect |
|---------|-------------------|-----------|
| Decimal (en-US) | `3.50` | `3,50` |
| Decimal (de-DE) | `3,50` | `3.50` |
| Currency (de-DE) | `33,15 €` | `€33,15` |
| Range | `9–17 h` | `9-17 h` |
| Date (en-US) | `March 15, 2026` | `2026-03-15` |
