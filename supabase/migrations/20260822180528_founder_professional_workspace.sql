-- Private professional documents and job application tracking for Nasirr Mayo.

create table if not exists public.founder_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  category text not null default 'other' check (category in ('resume', 'cover-letter', 'credential', 'reference', 'other')),
  file_name text not null,
  storage_bucket text not null default 'founder-documents',
  storage_path text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  version_label text not null default '',
  status text not null default 'current' check (status in ('current', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, storage_path)
);

create table if not exists public.founder_applications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company text not null check (char_length(company) between 1 and 160),
  role text not null check (char_length(role) between 1 and 200),
  location text not null default '',
  job_url text not null,
  status text not null default 'researching' check (status in ('researching', 'preparing', 'ready', 'submitted', 'interview', 'offer', 'closed')),
  match_notes text not null default '',
  next_action text not null default '',
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, job_url)
);

create index if not exists founder_documents_owner_status_created_idx
on public.founder_documents (owner_id, status, created_at desc);

create index if not exists founder_applications_owner_status_updated_idx
on public.founder_applications (owner_id, status, updated_at desc);

alter table public.founder_documents enable row level security;
alter table public.founder_applications enable row level security;

create policy "Founder only documents select"
on public.founder_documents for select to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only documents insert"
on public.founder_documents for insert to authenticated
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only documents update"
on public.founder_documents for update to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid)
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only documents delete"
on public.founder_documents for delete to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only applications select"
on public.founder_applications for select to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only applications insert"
on public.founder_applications for insert to authenticated
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only applications update"
on public.founder_applications for update to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid)
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only applications delete"
on public.founder_applications for delete to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

revoke all on public.founder_documents from anon;
revoke all on public.founder_applications from anon;
grant select, insert, update, delete on public.founder_documents to authenticated;
grant select, insert, update, delete on public.founder_applications to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('founder-documents', 'founder-documents', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Founder only document objects select"
on storage.objects for select to authenticated
using (
  bucket_id = 'founder-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select auth.uid()) = '75677100-97b7-4578-92c5-cf131997b580'::uuid
);

create policy "Founder only document objects insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'founder-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select auth.uid()) = '75677100-97b7-4578-92c5-cf131997b580'::uuid
);

create policy "Founder only document objects update"
on storage.objects for update to authenticated
using (
  bucket_id = 'founder-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select auth.uid()) = '75677100-97b7-4578-92c5-cf131997b580'::uuid
)
with check (
  bucket_id = 'founder-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select auth.uid()) = '75677100-97b7-4578-92c5-cf131997b580'::uuid
);

create policy "Founder only document objects delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'founder-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select auth.uid()) = '75677100-97b7-4578-92c5-cf131997b580'::uuid
);
