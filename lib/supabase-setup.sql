-- Reset existing objects
drop policy if exists "Enable inserts for all users" on public.pdf_documents;
drop policy if exists "Enable read for all users" on public.pdf_documents;
drop policy if exists "Enable updates for all users" on public.pdf_documents;
drop table if exists public.pdf_documents;

-- Create the pdf_documents table in the public schema
create table public.pdf_documents (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  filename text not null,
  storage_path text not null,
  pages jsonb not null default '[]'::jsonb,
  screenshots text[] not null default '{}'::text[],
  candidate_name text,
  position text,
  notes text,
  status text default 'unprocessed',
  analysis_data jsonb
);

-- Enable RLS
alter table public.pdf_documents enable row level security;

-- Create policies for pdf_documents
create policy "Enable inserts for all users"
on public.pdf_documents for insert
to authenticated, anon
with check (true);

create policy "Enable read for all users"
on public.pdf_documents for select
to authenticated, anon
using (true);

create policy "Enable updates for all users"
on public.pdf_documents for update
to authenticated, anon
using (true)
with check (true);

-- Storage setup (if you have storage admin rights)
-- If you don't have storage admin rights, you'll need to create the bucket
-- through the Supabase dashboard
do $$
begin
  if exists (
    select 1 from storage.buckets where id = 'pdfs'
  ) then
    update storage.buckets
    set public = true
    where id = 'pdfs';
  else
    insert into storage.buckets (id, name, public)
    values ('pdfs', 'pdfs', true);
  end if;
exception
  when insufficient_privilege then
    raise notice 'Skipping storage bucket creation - insufficient privileges';
end $$;

-- Storage policies (if you have storage admin rights)
do $$
begin
  drop policy if exists "Give anon users access to pdfs bucket" on storage.objects;
  create policy "Give anon users access to pdfs bucket"
  on storage.objects for all
  to anon
  using ( bucket_id = 'pdfs' )
  with check ( bucket_id = 'pdfs' );

  drop policy if exists "Public Access" on storage.objects;
  create policy "Public Access"
  on storage.objects for select
  to public
  using ( bucket_id = 'pdfs' AND auth.role() = 'anon' );
exception
  when insufficient_privilege then
    raise notice 'Skipping storage policy creation - insufficient privileges';
end $$;

-- Add JSON Schema validation for analysis_data
ALTER TABLE public.pdf_documents 
DROP CONSTRAINT IF EXISTS analysis_data_validation;

ALTER TABLE public.pdf_documents
ADD CONSTRAINT analysis_data_validation
CHECK (
    jsonb_typeof(analysis_data) = 'object' 
    AND (analysis_data IS NULL OR analysis_data @> '{}'::jsonb)
    AND (
        CASE WHEN analysis_data ? 'social_profiles' 
        THEN 
            jsonb_typeof(analysis_data->'social_profiles') = 'object'
            AND (analysis_data->'social_profiles' ? 'linkedin' OR TRUE)
            AND (analysis_data->'social_profiles' ? 'github' OR TRUE)
            AND (analysis_data->'social_profiles' ? 'portfolio' OR TRUE)
            AND (analysis_data->'social_profiles' ? 'twitter' OR TRUE)
            AND (
                CASE WHEN analysis_data->'social_profiles' ? 'other'
                THEN jsonb_typeof(analysis_data->'social_profiles'->'other') = 'array'
                ELSE TRUE
                END
            )
        ELSE TRUE
        END
    )
    AND (
        CASE WHEN analysis_data ? 'experience' 
        THEN jsonb_typeof(analysis_data->'experience') = 'array'
        ELSE TRUE
        END
    )
    AND (
        CASE WHEN analysis_data ? 'education' 
        THEN jsonb_typeof(analysis_data->'education') = 'array'
        ELSE TRUE
        END
    )
    AND (
        CASE WHEN analysis_data ? 'skills' 
        THEN jsonb_typeof(analysis_data->'skills') = 'array'
        ELSE TRUE
        END
    )
    AND (
        CASE WHEN analysis_data ? 'languages' 
        THEN jsonb_typeof(analysis_data->'languages') = 'array'
        ELSE TRUE
        END
    )
    AND (
        CASE WHEN analysis_data ? 'military_service' 
        THEN jsonb_typeof(analysis_data->'military_service') = 'object'
        ELSE TRUE
        END
    )
);

-- Add an index to improve query performance on social profiles
CREATE INDEX IF NOT EXISTS idx_pdf_documents_social_profiles 
ON public.pdf_documents USING gin ((analysis_data->'social_profiles'));