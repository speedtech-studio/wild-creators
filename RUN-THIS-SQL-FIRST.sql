-- Run this ONCE in Supabase SQL Editor.

-- Allow pupils to delete creature records.
drop policy if exists "wild class delete" on public.creatures;
create policy "wild class delete"
on public.creatures
for delete
to anon
using (true);

-- Optional but recommended: also remove the uploaded image when a creature is deleted.
drop policy if exists "wild class image delete" on storage.objects;
create policy "wild class image delete"
on storage.objects
for delete
to anon
using (
  bucket_id='creature-images'
  and (storage.foldername(name))[1]='live-class'
);
