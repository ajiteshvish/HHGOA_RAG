-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store uploaded documents metadata
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  type text not null,
  size integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table to store chunks and their embeddings
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents on delete cascade not null,
  chunk_index integer not null,
  content text not null,
  -- text-embedding-004 generates up to 768 dimensions.
  embedding vector(768),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

-- Create RLS policies for documents
create policy "Users can only view their own documents"
on public.documents for select
using ( auth.uid() = user_id );

create policy "Users can insert their own documents"
on public.documents for insert
with check ( auth.uid() = user_id );

create policy "Users can delete their own documents"
on public.documents for delete
using ( auth.uid() = user_id );

-- Create RLS policies for document_chunks (indirectly accessible if document is owned)
create policy "Users can view chunks of their documents"
on public.document_chunks for select
using ( 
  document_id in (
    select id from public.documents where user_id = auth.uid()
  ) 
);

-- Create a function to search for documents
-- This is a similarity search using pgvector
create or replace function match_document_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  join documents on documents.id = document_chunks.document_id
  where documents.user_id = p_user_id
    and 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;
