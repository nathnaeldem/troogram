-- ============================================================
-- STORAGE RLS POLICIES FOR TROOGRAM
-- ============================================================

-- 1. Create the 'posts' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('posts', 'posts', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Note: RLS is already enabled on storage.objects by default in Supabase.
-- We just need to add the policies.

-- Drop existing policies if they exist to prevent duplication errors
DROP POLICY IF EXISTS "Public read access to posts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own posts" ON storage.objects;

DROP POLICY IF EXISTS "Public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- ============================================================
-- POSTS BUCKET POLICIES
-- ============================================================

-- Allow anyone to view/read posts
CREATE POLICY "Public read access to posts" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'posts');

-- Allow authenticated users to upload new posts
CREATE POLICY "Authenticated users can upload posts" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'posts' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own posts
CREATE POLICY "Users can update their own posts" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'posts' 
  AND auth.uid() = owner
);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete their own posts" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'posts' 
  AND auth.uid() = owner
);

-- ============================================================
-- AVATARS BUCKET POLICIES
-- ============================================================

-- Allow anyone to view/read avatars
CREATE POLICY "Public read access to avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);
