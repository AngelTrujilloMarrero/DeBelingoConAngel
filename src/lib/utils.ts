import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeString(str: string): string {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Normaliza texto para búsquedas:
 * 1. Quita acentos (diacríticos)
 * 2. Pasa a minúsculas
 * 3. Quita artículos comunes al inicio (el, la, los, las...)
 * 4. Normaliza espacios
 */
export function normalizeSearchText(str: string): string {
  if (!str) return '';
  return str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}
