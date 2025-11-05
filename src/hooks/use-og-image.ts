import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OGImageOptions {
  title: string;
  description: string;
  type: 'tarot' | 'coffee' | 'dream' | 'palmistry' | 'horoscope' | 'birthchart' | 'numerology' | 'compatibility' | 'handwriting';
}

export const useOGImage = ({ title, description, type }: OGImageOptions) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const generateImage = async () => {
      setIsGenerating(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-og-image', {
          body: { title, description, type }
        });

        if (error) throw error;
        
        if (data?.imageUrl) {
          setImageUrl(data.imageUrl);
          
          // Update meta tags
          updateMetaTags(data.imageUrl, title, description);
        }
      } catch (error) {
        console.error('Error generating OG image:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    if (title && type) {
      generateImage();
    }

    // Cleanup meta tags on unmount
    return () => {
      removeMetaTags();
    };
  }, [title, description, type]);

  return { imageUrl, isGenerating };
};

const updateMetaTags = (imageUrl: string, title: string, description: string) => {
  // Update or create OG meta tags
  updateMetaTag('og:title', title);
  updateMetaTag('og:description', description);
  updateMetaTag('og:image', imageUrl);
  updateMetaTag('og:type', 'website');
  
  // Twitter Card tags
  updateMetaTag('twitter:card', 'summary_large_image');
  updateMetaTag('twitter:title', title);
  updateMetaTag('twitter:description', description);
  updateMetaTag('twitter:image', imageUrl);
};

const updateMetaTag = (property: string, content: string) => {
  const isOg = property.startsWith('og:');
  const attribute = isOg ? 'property' : 'name';
  
  let element = document.querySelector(`meta[${attribute}="${property}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, property);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
};

const removeMetaTags = () => {
  const tags = ['og:title', 'og:description', 'og:image', 'og:type', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
  
  tags.forEach(tag => {
    const isOg = tag.startsWith('og:');
    const attribute = isOg ? 'property' : 'name';
    const element = document.querySelector(`meta[${attribute}="${tag}"]`);
    if (element) {
      element.remove();
    }
  });
};
