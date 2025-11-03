export interface ParsedTextSegment {
  type: 'text' | 'mention' | 'hashtag' | 'link';
  content: string;
  username?: string; // for mentions
  tag?: string; // for hashtags
  url?: string; // for links
}

export const parseText = (text: string): ParsedTextSegment[] => {
  const segments: ParsedTextSegment[] = [];
  
  // Regex patterns
  const mentionRegex = /@(\w+)/g;
  const hashtagRegex = /#(\w+)/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Combine all patterns
  const combinedRegex = /(@\w+)|(#\w+)|(https?:\/\/[^\s]+)/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }
    
    // Add the matched segment
    const matchedText = match[0];
    
    if (matchedText.startsWith('@')) {
      segments.push({
        type: 'mention',
        content: matchedText,
        username: matchedText.substring(1),
      });
    } else if (matchedText.startsWith('#')) {
      segments.push({
        type: 'hashtag',
        content: matchedText,
        tag: matchedText.substring(1),
      });
    } else if (matchedText.startsWith('http')) {
      segments.push({
        type: 'link',
        content: matchedText,
        url: matchedText,
      });
    }
    
    lastIndex = match.index + matchedText.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }
  
  return segments;
};

export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

export const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#(\w+)/g;
  const hashtags: string[] = [];
  let match;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1].toLowerCase());
  }
  
  return [...new Set(hashtags)]; // Remove duplicates
};

export const highlightText = (text: string): string => {
  return text
    .replace(/@(\w+)/g, '<span class="text-primary font-semibold">@$1</span>')
    .replace(/#(\w+)/g, '<span class="text-accent font-semibold">#$1</span>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>');
};
