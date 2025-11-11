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
 * Upload file to Supabase Storage with progress tracking
 */
export const uploadToStorage = async (
  file: File,
  bucket: 'posts' | 'stories' | 'profiles' | 'videos',
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string | null> => {
  try {
    let fileToUpload: File | Blob = file;
    
    // Compress images (not videos)
    if (file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file, 1920, 0.8);
    }

    // Determine correct file extension based on MIME type
    let fileExt = file.name.split('.').pop();
    if (file.type === 'video/webm') {
      fileExt = 'webm';
    } else if (file.type.startsWith('video/')) {
      // Keep original extension for other video types
      fileExt = file.name.split('.').pop();
    }

    // Check file size limits
    const fileSizeMB = fileToUpload.size / (1024 * 1024);
    const bucketLimits = {
      posts: 50,
      stories: 20,
      profiles: 5,
      videos: 500
    };
    
    if (fileSizeMB > bucketLimits[bucket]) {
      throw new Error(`Dosya boyutu ${bucketLimits[bucket]}MB limitini aşıyor (${fileSizeMB.toFixed(2)}MB)`);
    }

    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload with progress tracking using XMLHttpRequest
    if (onProgress) {
      const uploadPromise = new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            onProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.Key) {
                resolve(response.Key);
              } else {
                reject(new Error('Upload başarısız - yanıt formatı hatalı'));
              }
            } catch (e) {
              reject(new Error('Upload yanıtı işlenemedi'));
            }
          } else {
            reject(new Error(`Upload başarısız - HTTP ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Ağ hatası - yükleme başarısız'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Yükleme iptal edildi'));
        });

        // Get upload URL and token
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`);
        xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_KEY}`);
        xhr.setRequestHeader('apikey', SUPABASE_KEY);
        xhr.setRequestHeader('Content-Type', fileToUpload.type || 'application/octet-stream');
        xhr.setRequestHeader('cache-control', '3600');
        
        xhr.send(fileToUpload);
      });

      await uploadPromise;
      onProgress(100);
    } else {
      // Standard upload without progress tracking
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error details:', error);
        throw new Error(error.message || 'Yükleme başarısız');
      }
    }

    // Get signed URL (1 year expiry for user content)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, 31536000); // 365 days

    if (signedError) {
      console.error('Signed URL error:', signedError);
      throw new Error('URL oluşturulamadı');
    }

    return signedData.signedUrl;
  } catch (error: any) {
    console.error('Storage upload error:', error);
    throw error; // Throw instead of returning null
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
  onProgress?: (progress: number) => void;
}

interface VideoCompressionResult {
  compressedVideo: Blob;
  thumbnail: string; // Base64 data URL
}

const QUALITY_SETTINGS = {
  high: { bitrate: 5000000, scale: 1 },      // 5 Mbps, original size
  medium: { bitrate: 2500000, scale: 0.75 }, // 2.5 Mbps, 75% size
  low: { bitrate: 1000000, scale: 0.5 },     // 1 Mbps, 50% size
};

/**
 * Generate thumbnail from video at specified time
 */
export const generateVideoThumbnail = async (
  file: File,
  timeInSeconds: number = 1
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.currentTime = timeInSeconds;
    
    video.onloadeddata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(video.src);
      resolve(thumbnail);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to generate thumbnail'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Compress video using HTML5 Canvas and MediaRecorder
 */
export const compressVideo = async (
  file: File,
  options: VideoCompressionOptions
): Promise<VideoCompressionResult> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    let thumbnail: string | null = null;
    
    video.onloadedmetadata = async () => {
      // Generate thumbnail from first frame
      try {
        thumbnail = await generateVideoThumbnail(file, 0.5);
      } catch (error) {
        console.error('Thumbnail generation failed:', error);
      }
      
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
            resolve({
              compressedVideo: blob,
              thumbnail: thumbnail || '' // Return empty string if thumbnail generation failed
            });
          };
          
          mediaRecorder.start();
          
          // Play video and draw frames with progress tracking
          video.play();
          const drawFrame = () => {
            if (!video.paused && !video.ended) {
              ctx.drawImage(video, 0, 0, width, height);
              
              // Report progress
              if (options.onProgress && video.duration) {
                const progress = Math.min(Math.round((video.currentTime / video.duration) * 100), 99);
                options.onProgress(progress);
              }
              
              requestAnimationFrame(drawFrame);
            } else {
              if (options.onProgress) {
                options.onProgress(100);
              }
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
