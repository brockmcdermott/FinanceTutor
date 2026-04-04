CREATE POLICY "Enable read access to profile pictures for all users" ON "storage"."objects"
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'profile_pictures'
);

CREATE POLICY "Enable insert access to profile pictures for authenticated users" ON "storage"."objects"
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile_pictures' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

CREATE POLICY "Enable update access to profile pictures for authenticated users" ON "storage"."objects"
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile_pictures' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
)
WITH CHECK (
  bucket_id = 'profile_pictures' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

CREATE POLICY "Enable delete access to profile pictures for authenticated users" ON "storage"."objects"
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile_pictures' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

