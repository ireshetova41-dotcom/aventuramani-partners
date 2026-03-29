

## Plan: Agent profile, referral codes, and enhanced tracking

### 1. Database migration

Add columns to `profiles` table:
- `agency_name text`
- `legal_name text`, `inn text`, `kpp text`, `ogrn text`, `legal_address text`
- `bank_name text`, `bik text`, `account_number text`, `corr_account text`
- `ref_code text unique` — auto-generated AM-XXXX format
- `profile_completed boolean default false`

Add a trigger/function to auto-generate `ref_code` on new profile creation (format `AM-` + 4 random alphanumeric chars). Also add a unique index on `ref_code`.

### 2. Catalog referral logic update (`Catalog.tsx`)

Currently `ref_agent_id` stores raw URL param. Change to:
- Read `?ref=AM-XXXX` from URL
- Look up the agent's `user_id` from `profiles` where `ref_code = 'AM-XXXX'`
- Store resolved `user_id` as `ref_agent_id` in `client_applications`

This ensures `ref_agent_id` is always a valid UUID, not the ref code string.

### 3. Dashboard — Profile section

Add an expandable/collapsible "Мой профиль" section with editable fields for agency name, legal details, and bank details. Save via `supabase.from("profiles").update(...)`.

Show a banner hint "Заполните профиль, чтобы получать выплаты комиссий" when `profile_completed` is false or key fields are empty.

### 4. Dashboard — Referral link block

New card showing:
- Agent's ref code (`AM-XXXX`)
- Full link: `https://aventuramani-partners.lovable.app/catalog?ref=AM-XXXX`
- Copy button (clipboard API)
- Collapsible instruction text (the 6-step guide from the request)

### 5. Dashboard — Referral applications tracking

Fetch `client_applications` where `ref_agent_id = userId` and merge into the applications list. In the "Мои заявки" section, show a colored badge "Реф-ссылка" (e.g. blue/teal) on referral apps vs no badge on direct ones.

### 6. Dashboard — Statistics split

Replace single "Заявок" counter with two:
- "Прямые" (direct `applications` count) with a user icon
- "По реф-ссылке" (`client_applications` count) with a link icon

Keep total sum and commission counters, now combining both sources.

### Files to change

| File | Change |
|------|--------|
| Migration SQL | Add profile columns + ref_code generation trigger |
| `src/pages/Catalog.tsx` | Resolve ref code to user_id before insert |
| `src/pages/Dashboard.tsx` | Add profile editor, referral block, fetch client_applications, split stats, badge on ref apps |

### Technical details

- Ref code generation: DB function `generate_ref_code()` using `'AM-' || upper(substr(md5(random()::text), 1, 4))` with retry on collision
- Modify `handle_new_user()` trigger to also set `ref_code`
- RLS: profiles update policy already allows own updates — no change needed
- `client_applications` select policy for agents already exists (`auth.uid() = ref_agent_id`)

