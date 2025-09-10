/**
 * Email Template Sanitization Utilities
 * 
 * This module provides functions to sanitize user input for email templates
 * to prevent Cross-Site Scripting (XSS) attacks.
 */

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Escapes HTML special characters to make them safe for display
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes text content for plain text emails
 * Removes or escapes potentially dangerous characters
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[\r\n\t]/g, ' ') // Replace line breaks and tabs with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Sanitizes HTML content and converts line breaks to <br> tags
 * Useful for preserving formatting in HTML emails while preventing XSS
 */
export function sanitizeHtmlWithLineBreaks(input: string): string {
  if (!input) return '';
  
  return sanitizeHtml(input).replace(/\n/g, '<br>');
}

/**
 * Sanitizes a date for display in emails
 * Ensures the date is properly formatted and safe
 */
export function sanitizeDate(date: Date): string {
  if (!date || !(date instanceof Date)) return '';
  
  try {
    return date.toLocaleString();
  } catch {
    return '';
  }
}
