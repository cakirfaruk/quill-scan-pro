import { supabase } from "@/integrations/supabase/client";

/**
 * Optimize and compress image before upload
 */
const compressImage = async (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', quality);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Upload file to Supabase Storage
 */
export const uploadToStorage = async (
  file: File,
  bucket: 'posts' | 'stories' | 'profiles' | 'videos',
  userId: string
): Promise<string | null> => {
  try {
    let fileToUpload: File | Blob = file;
    
    // Compress images (not videos)
    if (file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file, 1920, 0.8);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get signed URL (1 year expiry for user content)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, 31536000); // 365 days

    if (signedError) throw signedError;

    return signedData.signedUrl;
  } catch (error) {
    console.error('Storage upload error:', error);
    return null;
  }
};

/**
 * Delete file from Supabase Storage
 */
export const deleteFromStorage = async (
  url: string,
  bucket: 'posts' | 'stories' | 'profiles' | 'videos'
): Promise<boolean> => {
  try {
    // Extract path from URL
    const urlParts = url.split(`/${bucket}/`);
    if (urlParts.length < 2) return false;
    
    const path = urlParts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Storage delete error:', error);
    return false;
  }
};

/**
 * Video compression quality presets
 */
export type VideoQuality = 'high' | 'medium' | 'low';

interface VideoCompressionOptions {
  quality: VideoQuality;
  maxWidth?: number;
  maxHeight?: number;
}

const QUALITY_SETTINGS = {
  high: { bitrate: 5000000, scale: 1 },      // 5 Mbps, original size
  medium: { bitrate: 2500000, scale: 0.75 }, // 2.5 Mbps, 75% size
  low: { bitrate: 1000000, scale: 0.5 },     // 1 Mbps, 50% size
};

/**
 * Compress video using HTML5 Canvas and MediaRecorder
 */
export const compressVideo = async (
  file: File,
  options: VideoCompressionOptions
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = async () => {
      video.currentTime = 0;
      
      video.onseeked = async () => {
        try {
          const settings = QUALITY_SETTINGS[options.quality];
          const canvas = document.createElement('canvas');
          
          // Calculate dimensions
          let width = video.videoWidth * settings.scale;
          let height = video.videoHeight * settings.scale;
          
          if (options.maxWidth && width > options.maxWidth) {
            height = (height * options.maxWidth) / width;
            width = options.maxWidth;
          }
          if (options.maxHeight && height > options.maxHeight) {
            width = (width * options.maxHeight) / height;
            height = options.maxHeight;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d')!;
          const stream = canvas.captureStream();
          
          // Set up MediaRecorder
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: settings.bitrate,
          });
          
          const chunks: Blob[] = [];
          mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            resolve(blob);
          };
          
          mediaRecorder.start();
          
          // Play video and draw frames
          video.play();
          const drawFrame = () => {
            if (!video.paused && !video.ended) {
              ctx.drawImage(video, 0, 0, width, height);
              requestAnimationFrame(drawFrame);
            } else {
              mediaRecorder.stop();
              URL.revokeObjectURL(video.src);
            }
          };
          drawFrame();
          
        } catch (error) {
          reject(error);
        }
      };
    };
    
    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Convert base64 to File object
 */
export const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
