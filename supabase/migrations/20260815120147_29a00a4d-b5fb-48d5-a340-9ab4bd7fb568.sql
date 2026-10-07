ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_path text;

CREATE POLICY "receipts_insert_own_folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "receipts_select_owner_or_group_member"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.receipt_path = storage.objects.name
        AND public.is_group_member(e.group_id, auth.uid())
    )
  )
);

CREATE POLICY "receipts_delete_own_folder"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);