-- UP Cloth Market — storage bucket + policies for product images
-- Run AFTER 0001_schema.sql

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images"
on storage.objects for select
using (bucket_id = 'product-images');

drop policy if exists "auth upload product images" on storage.objects;
create policy "auth upload product images"
on storage.objects for insert
with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "auth update product images" on storage.objects;
create policy "auth update product images"
on storage.objects for update
using (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "auth delete product images" on storage.objects;
create policy "auth delete product images"
on storage.objects for delete
using (bucket_id = 'product-images' and auth.role() = 'authenticated');