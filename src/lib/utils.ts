import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(year: string, month: string, day: string): string {
  return `${year}-${month}-${day}`;
}

export function parseEntryId(id: string): { year: string; month: string; day: string } {
  const [year, month, day] = id.split('-');
  return { year, month, day };
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function getExcerpt(content: string, maxLength: number = 150): string {
  // Remove markdown formatting
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/`(.*?)`/g, '$1') // Inline code
    .replace(/\n/g, ' ') // Line breaks
    .trim();

  if (plainText.length <= maxLength) return plainText;
  
  const truncated = plainText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  return lastSpaceIndex > 0 
    ? truncated.substring(0, lastSpaceIndex) + '...'
    : truncated + '...';
}

export function getWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(word => word.length > 0).length;
}