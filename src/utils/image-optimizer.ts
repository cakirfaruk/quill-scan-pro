
/**
 * Utility to generate optimized URLs for Supabase Storage images.
 * Uses Supabase Image Transformations to request resized, compressed, and WebP formatted images.
 */
export const getOptimizedImageUrl = (
    url: string | null | undefined,
    width: number,
    height: number,
    options: {
        resize?: 'cover' | 'contain' | 'fill';
        quality?: number;
        format?: 'webp' | 'jpeg' | 'png';
    } = {}
): string | undefined => {
    if (!url) return undefined;

    // Only optimize Supabase Storage URLs
    // Standard pattern: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    // Render pattern: https://[project].supabase.co/storage/v1/render/image/public/[bucket]/[path]

    if (!url.includes('supabase.co/storage')) {
        return url;
    }

    try {
        const urlObj = new URL(url);

        // Check if it's already a render URL or standard object URL
        // If it's a standard object URL, we might need to switch to render endpoint depending on Supabase version,
        // but usually appending query params to the public URL works if Image Transformations are enabled.
        // However, the official transformation URL usually looks like /render/image/public for older instances 
        // or just query params on the object URL for newer ones.
        // We'll stick to appending query params to the existing URL structure which acts as a "Request Transformation"

        // Set default options
        const resize = options.resize || 'cover';
        const quality = options.quality || 75;
        const format = options.format || 'webp';

        urlObj.searchParams.set('width', width.toString());
        urlObj.searchParams.set('height', height.toString());
        urlObj.searchParams.set('resize', resize);
        urlObj.searchParams.set('quality', quality.toString());
        urlObj.searchParams.set('format', format);

        return urlObj.toString();
    } catch (e) {
        console.error("Error optimizing image URL:", e);
        return url;
    }
};
