// This file provides a fallback implementation of utils 
// to resolve any path reference issues
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

/**
 * Combines class names with Tailwind CSS utilities
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string to a human-readable format
 */
export function formatDate(input: string | number | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  return format(date, "MMMM dd, yyyy");
}

/**
 * Truncates text to a specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Converts a string to URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

/**
 * Generates a random ID of specified length
 */
export function getRandomID(length: number = 6): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Generates a unique token for resume access
 */
export function generateResumeAccessToken(): string {
  return `access_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Calculates reading time in minutes based on content length
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Fetches data from an API endpoint with error handling
 */
export async function fetchFromAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Error ${response.status}: Failed to fetch data from ${url}`);
  }
  
  return response.json();
}

/**
 * Checks if the current environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Validates an email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Groups an array of items by a specified key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((acc: Record<string, T[]>, item) => {
    const groupKey = String(item[key]);
    acc[groupKey] = [...(acc[groupKey] || []), item];
    return acc;
  }, {});
}

/**
 * Debounces a function to limit how often it can fire
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function(...args: Parameters<T>): void {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Creates a delay using a Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}