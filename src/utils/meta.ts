/**
 * Dinamik per-page SEO meta tag güncellemesi.
 * SPA'larda her route değişiminde çağrılmalı.
 */
export const updatePageMeta = (title: string, description?: string, canonicalPath?: string) => {
  // Title
  document.title = title.includes('|') ? title : `${title} | Astro Social`;

  // Meta Description
  if (description) {
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description;
  }

  // OG Title
  let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.content = title.includes('|') ? title : `${title} | Astro Social`;

  // OG Description
  if (description) {
    let ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.content = description;
  }

  // Canonical URL
  const baseUrl = 'https://analiz.sebanyazilim.com';
  const canonical = canonicalPath ? `${baseUrl}${canonicalPath}` : baseUrl;
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href = canonical;

  // OG URL
  let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.content = canonical;
};
