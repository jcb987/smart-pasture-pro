-- Create storage bucket for user backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-backups', 'user-backups', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Users can only access their own backups
CREATE POLICY "Users can upload their own backups"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-backups' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own backups"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-backups' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own backups"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-backups' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own backups"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-backups' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);