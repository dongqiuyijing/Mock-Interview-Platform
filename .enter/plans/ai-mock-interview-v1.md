# Plan: 我的简历 (Resumes) — Onboarding + Storage + Picker

## Context
Currently a candidate's resume is just free text pasted/OCR'd into the New Interview form (`NewTask.tsx`), and nothing is saved per-user. The user wants:
1. A first-run **onboarding** that asks a newly-registered user to upload their first resume (image), storing **both the image and the OCR'd text** in the database. Onboarding is **skippable** ("补传 later").
2. A **"我的简历" (My Resumes)** section in the left sidebar listing each resume's **name + thumbnail/entry**.
3. In New Interview, replace the resume field's **"上传图片"** OCR button with a **"配置简历"** button that opens a **dialog** where the user can **pick an existing resume** OR **upload a new one** (image -> OCR -> name -> save). Selecting a resume fills the resume text (and links it).

Decisions confirmed with user:
- Onboarding **skippable**.
- Dialog allows **both** selecting existing and uploading new.
- Resume **name = user-entered**, defaulting to the file name (editable).

## Data model

### New table `resumes` (migration)
```sql
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  content text not null,          -- OCR'd / pasted text
  image_path text,                -- storage path in 'resumes' bucket (nullable: text-only allowed)
  created_at timestamptz not null default now()
);
alter table public.resumes enable row level security;
create policy "Users manage own resumes" on public.resumes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_resumes_user on public.resumes(user_id);
```

### Storage bucket `resumes` (private)
- Create private bucket `resumes`.
- RLS policies on `storage.objects` so a user can read/write only files under a folder named with their `auth.uid()` (path = `{user_id}/{uuid}.{ext}`):
  - INSERT/SELECT/UPDATE/DELETE `using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1])`.
- Access images via `supabase.storage.from('resumes').createSignedUrl(path, ttl)` (bucket is private).

### Onboarding flag
- Reuse `profiles` table. Add column `onboarded boolean not null default false`.
- Mark `onboarded = true` when the user uploads the first resume OR clicks "skip".

## Files to add / modify

### New: `src/lib/resumes.ts` (data layer, mirrors `api.ts` patterns)
- `interface Resume { id; name; content; image_path: string | null; created_at }`
- `listResumes(): Promise<Resume[]>` — select for current user, newest first.
- `createResume({ name, content, file? }): Promise<Resume>` — if `file` given: upload to `resumes/{uid}/{uuid.ext}` then insert row with `image_path`; else insert text-only.
- `deleteResume(id, image_path?)` — delete row (+ remove storage object if present).
- `getResumeSignedUrl(path): Promise<string|null>` — `createSignedUrl`.
- `getProfileOnboarded()` / `setOnboarded(true)` — read/update `profiles.onboarded`.

### New: `src/components/ImageOcrReader.ts` (extract reusable OCR helper)
- Pull the Tesseract recognize logic out of `ImageOcrButton.tsx` into a shared async fn `recognizeImage(file, onProgress): Promise<string>` so both `ImageOcrButton` and the new resume dialog reuse it. `ImageOcrButton.tsx` refactored to call it (keep current behavior for JD field).

### New: `src/components/ResumePickerDialog.tsx`
- Uses `@/components/ui/dialog`.
- Two areas:
  - **Existing resumes** list (radio-style select). Each row: name + created date; selecting calls `onSelect(resume)` -> fills text into NewTask, stores selected resume id.
  - **Upload new**: file input (image) -> `recognizeImage` (progress) -> name input prefilled with file name -> "保存" -> `createResume({name, content, file})` -> appears in list and auto-selected.
- Empty state when no resumes: prompt to upload.

### New: `src/components/OnboardingResumeDialog.tsx`
- Rendered once when `user && profile.onboarded === false`.
- Modal (non-dismissable backdrop) explaining "上传你的第一份简历"; upload image -> OCR -> name -> save (`createResume`) -> `setOnboarded(true)` -> close. "跳过" button -> `setOnboarded(true)` -> close.
- Reuses `recognizeImage` + `createResume`.

### Modify: `src/components/AppLayout.tsx`
- Add a **"我的简历"** section in the sidebar (below NAV): heading + list of resumes (name; small `FileText`/thumbnail icon). Each item links to `/new` after preselecting? Simpler: clicking an item opens the resume image in a new tab via signed URL, or just lists name. Plan: list resume names with a `FileText` icon; a small "管理"/＋ affordance. Show up to ~5, with the count.
- Load via `listResumes()` in a small hook; render in both desktop sidebar and (optionally) skip on mobile row to avoid clutter.
- Onboarding dialog mounted here (so it shows on any authenticated page) OR in `App.tsx`. Plan: mount `OnboardingResumeDialog` inside `AppLayout` once.

### Modify: `src/pages/NewTask.tsx`
- Replace the resume `Field` `action` (currently `<ImageOcrButton>` for resume) with a **"配置简历"** button (`FileUser`/`Settings2` icon) that opens `ResumePickerDialog`.
- On select: `setResumeText(resume.content)` and keep `selectedResumeId` in state (optional, for display "已选择：{name}").
- Keep JD field's `ImageOcrButton` unchanged.
- After selecting a resume, trigger `autoGenerateConfig` (resume now available) consistent with existing behavior.

### i18n: `public/locales/en.json` + `zh-CN.json`
Add keys (camelCase, flat, no underscores):
- `nav.resumes` ("我的简历" / "My resumes"), `resumes.empty`, `resumes.manage`
- `onboarding.title`, `onboarding.desc`, `onboarding.upload`, `onboarding.nameLabel`, `onboarding.namePh`, `onboarding.save`, `onboarding.skip`, `onboarding.saved`
- `resumePicker.title`, `resumePicker.existing`, `resumePicker.uploadNew`, `resumePicker.select`, `resumePicker.selected`, `resumePicker.nameLabel`, `resumePicker.save`, `resumePicker.empty`, `resumePicker.recognizing`
- `new.resume.configure` ("配置简历" / "Configure resume")
- resume error/success toasts: `resumes.saved`, `resumes.deleted`, `resumes.error.*`

## Reuse (avoid new code)
- OCR: existing Tesseract logic in `ImageOcrButton.tsx` -> extracted to `recognizeImage`.
- Dialog: `@/components/ui/dialog`, buttons/inputs/cards from `@/components/ui/*`.
- Auth: `useAuth()` (`src/contexts/AuthContext.tsx`), `supabase` client.
- Data patterns: follow `src/lib/api.ts` (getUser + RLS insert/select).
- `profiles` table already exists (used by quota); just add `onboarded`.

## Verification
1. **Migration & bucket**: confirm `resumes` table, `onboarded` column, `resumes` storage bucket + policies exist.
2. **Onboarding**: register a brand-new user -> onboarding dialog appears -> upload a resume image -> OCR text shows -> name defaults to file name (editable) -> save -> dialog closes, resume appears in sidebar "我的简历". Re-login -> dialog does NOT reappear. Also test "跳过" -> dialog closes, no resume, doesn't reappear.
3. **Sidebar**: "我的简历" lists saved resume names with icon.
4. **New Interview**: resume field shows **"配置简历"** -> opens dialog -> can pick existing (fills resume text) AND can upload+save new (then auto-selected). JD OCR button unchanged.
5. **RLS isolation**: a second user does not see the first user's resumes (verify via query / second account).
6. `run_lint` passes (0 errors); JSON locale files valid; preview refresh works.
