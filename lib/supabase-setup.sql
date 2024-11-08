-- Drop existing tables and policies
drop policy if exists "Enable inserts for all users" on pdf_documents;
drop policy if exists "Enable read for all users" on pdf_documents;
drop policy if exists "Enable storage for all users" on storage.objects;
drop table if exists pdf_documents;

-- Create the pdf_documents table
create table pdf_documents (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  filename text not null,
  storage_path text not null,
  pages jsonb not null default '[]'::jsonb,
  screenshots text[] not null default '{}'::text[]
);

-- Enable RLS
alter table pdf_documents enable row level security;

-- Create policies for pdf_documents
create policy "Enable inserts for all users"
on pdf_documents for insert
to anon, authenticated
with check (true);

create policy "Enable read for all users"
on pdf_documents for select
to anon, authenticated
using (true);

-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', true)
on conflict (id) do update
set public = true;

-- Create storage policies
drop policy if exists "Give anon users access to pdfs bucket" on storage.objects;
create policy "Give anon users access to pdfs bucket"
on storage.objects for all
to anon
using ( bucket_id = 'pdfs' )
with check ( bucket_id = 'pdfs' );

-- Enable public access to bucket objects
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'pdfs' AND auth.role() = 'anon' );