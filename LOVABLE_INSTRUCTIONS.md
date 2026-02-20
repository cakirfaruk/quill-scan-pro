# URGENT: PERFORMANCE & ARCHITECTURE UPDATE FOR LOVABLE AI

Hello Lovable AI,

Another AI agent (Antigravity) has stepped in to resolve a catastrophic performance issue (118+ seconds Main Thread blocking) in the Astro Social application. The root cause was that the application was storing multi-megabyte image and video files (Avatars, Stories, Post Media, Video Thumbnails, Voice Notes) directly in the PostgreSQL database rows as massive **Base64** strings. 

This caused the DOM parser to crash when fetching data on the Feed and Profile pages, as it was downloading 50MB+ of raw JSON string data per request.

### What Has Been Fixed (Do Not Revert These Changes):
1. **`Profile.tsx` & `Settings.tsx`**: Avatar uploads have been rerouted from `FileReader.result` to `uploadToStorage("profiles")`.
2. **`CreateStoryDialog.tsx`**: Story media is now uploaded to the `stories` storage bucket instead of being saved as base64.
3. **`VideoUploader.tsx`**: Auto-generated canvas thumbnails are now converted to `File` objects and uploaded to the `videos` bucket.
4. **`Messages.tsx`**: Chat attachments (Voice notes, images, files) are now strictly uploaded to the `messages` bucket. The DB now only stores the public URL.
5. **`src/utils/storageUpload.ts`**: Updated to support the `messages` bucket type.

### YOUR IMMEDIATE TASKS:

#### 1. Execute the Purge Script (CRITICAL)
The frontend code is fixed, but the Supabase database still contains the old, bloated Base64 strings which are still being downloaded and slowing down the app. 
You must execute the contents of the `purge_base64.sql` file (located in the project root) in the **Supabase SQL Editor**. This will clear out the toxic data. 

**Contents of `purge_base64.sql`:**
```sql
UPDATE public.profiles SET profile_photo = NULL WHERE profile_photo LIKE 'data:image%';
UPDATE public.profiles SET cover_photo = NULL WHERE cover_photo LIKE 'data:image%';
UPDATE public.stories SET media_url = NULL WHERE media_url LIKE 'data:image%' OR media_url LIKE 'data:video%';
UPDATE public.posts SET media_url = NULL WHERE media_url LIKE 'data:image%' OR media_url LIKE 'data:video%';
UPDATE public.user_videos SET thumbnail_url = NULL WHERE thumbnail_url LIKE 'data:image%';
```

#### 2. Performance Testing Protocol
The user was running Lighthouse tests in Development Mode (`npm run dev`), which does not minify JS and serves huge bundles, leading to skewed Lighthouse scores.
**If the user asks you to check performance:**
Do **NOT** use `npm run dev`. You must build the app first:
1. Run `npm run build`
2. Run `npm run preview`
3. Test the application on the preview port (usually `4173`).

#### 3. Future Development Rules Constraint
From now on, **NEVER** save `FileReader.readAsDataURL` outputs to the PostgreSQL database. **ALL** user-generated media must be uploaded via `uploadToStorage` to a Supabase Storage bucket, and only the resulting `publicUrl` should be saved to the database. (Edge functions like `analyze-palmistry` using base64 for OpenAI Vision APIs internally without saving to the DB are fine).

Proceed with any user requests ensuring these architectural rules remain intact.
