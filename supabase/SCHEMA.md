# Database Schema

## Overview

`user_sessions` is the central table. All other tables reference it via FK + CASCADE (delete a session - all related data is deleted).

RLS is enabled on all tables with zero policies = only `service_role` can read/write. The anon key is blocked.

```
user_sessions (PK: session_id)
  |- user_events        (FK session_id - CASCADE)
  |- newsletter_signups (FK session_id - CASCADE)
  +- survey_responses   (FK session_id - CASCADE, UNIQUE)
```

---

## Tables

### `user_sessions`
Central session table. One row per browser session.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `session_id` | UUID PK | `gen_random_uuid()` | Immutable after INSERT |
| `browser_name` | TEXT | | e.g. "Chrome" |
| `browser_version` | TEXT | | e.g. "122.0" |
| `user_agent` | TEXT | | Raw UA string |
| `os_name` | TEXT | | e.g. "macOS" |
| `device_type` | TEXT | | "desktop" / "mobile" / "tablet" |
| `screen_resolution` | TEXT | | e.g. "1920x1080" |
| `ip_address` | TEXT | | |
| `country` | TEXT | | e.g. "AT" |
| `city` | TEXT | | e.g. "Wien" |
| `language` | TEXT | | e.g. "de-AT" |
| `timezone` | TEXT | | e.g. "Europe/Vienna" |
| `referrer` | TEXT | | |
| `utm_source` | TEXT | | |
| `utm_medium` | TEXT | | |
| `utm_campaign` | TEXT | | |
| `environment` | TEXT | `'production'` | dev / preview / production |
| `is_test_user` | BOOLEAN | `FALSE` | Flagged by `detect_test_environment()` |
| `session_start` | TIMESTAMPTZ | `now()` | |
| `session_end` | TIMESTAMPTZ | | Set on session close |
| `created_at` | TIMESTAMPTZ | `now()` | |
| `updated_at` | TIMESTAMPTZ | `now()` | Auto-updated via trigger |

**Edge Function:** `track-session`

---

### `user_events`
Custom event tracking (clicks, form interactions, etc.).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID PK | `gen_random_uuid()` | |
| `session_id` | UUID FK | | - `user_sessions` CASCADE |
| `event_type` | TEXT NOT NULL | | e.g. "cta_click", "survey_start" |
| `page_url` | TEXT NOT NULL | | |
| `element_id` | TEXT | | |
| `element_text` | TEXT | | |
| `custom_data` | JSONB | | Arbitrary payload |
| `timestamp` | TIMESTAMPTZ | `now()` | |

**Edge Function:** `track-event`

---

### `newsletter_signups`
Email signups from landing page or survey.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID PK | `gen_random_uuid()` | |
| `session_id` | UUID FK | | - `user_sessions` CASCADE |
| `email` | TEXT NOT NULL | | Validated, lowercased |
| `source` | TEXT | `'root'` | e.g. "root", "survey", "exit_intent" |
| `subscribed` | BOOLEAN | `TRUE` | |
| `created_at` | TIMESTAMPTZ | `now()` | |
| `updated_at` | TIMESTAMPTZ | `now()` | Auto-updated via trigger |

**Edge Function:** `newsletter-signup`

---

### `survey_responses`
One survey per session (UNIQUE constraint on `session_id`). Uses UPSERT.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID PK | `gen_random_uuid()` | |
| `session_id` | UUID FK UNIQUE | | - `user_sessions` CASCADE |
| `survey_type` | TEXT NOT NULL | | e.g. "onboarding", "exit", "nps", "feedback" |
| `responses` | JSONB NOT NULL | `'{}'` | All answers as flexible JSON |
| `completed` | BOOLEAN | `FALSE` | Set to TRUE on final screen |
| `created_at` | TIMESTAMPTZ | `now()` | |
| `updated_at` | TIMESTAMPTZ | `now()` | Auto-updated via trigger |

**Edge Function:** `save-survey-response`

**Usage:** Store survey-specific fields in `responses` JSONB. Example:
```json
{
  "q1_satisfaction": "very_happy",
  "q2_recommend": 9,
  "q3_feedback": "Love the product"
}
```

---

## Helper Functions

| Function | Purpose |
|----------|---------|
| `update_updated_at_column()` | Trigger: auto-sets `updated_at = now()` on UPDATE |
| `protect_immutable_cols()` | Trigger: prevents `session_id` from being changed |
| `detect_test_environment(referrer, ua)` | Returns `'dev'` / `'preview'` / `'production'` |
| `validate_session_exists(session_id)` | SECURITY DEFINER - checks session exists (bypasses RLS) |

## Indexes

- FK columns: `session_id` on all child tables
- Query patterns: `created_at`, `is_test_user`, `event_type`, `timestamp`, `email`, `completed`

## Triggers (on all tables)

- `trg_*_updated_at` - `update_updated_at_column()`
- `trg_*_protect_immutable` - `protect_immutable_cols()`
