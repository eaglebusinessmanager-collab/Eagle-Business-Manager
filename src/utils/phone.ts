/**
 * Phone utilities optimized for Uganda (+256)
 * Supports formats: 07XXXXXXXX, +2567XXXXXXXX, 2567XXXXXXXX, 070, 075, 077, 078, etc.
 */

export function normalizeUgandanPhone(input: string): string {
  if (!input) return '';
  // Strip all non-digit and non-plus characters
  let clean = input.replace(/[^\d+]/g, '');

  // If starts with +256, keep as is
  if (clean.startsWith('+256')) {
    return clean;
  }
  // If starts with 256
  if (clean.startsWith('256')) {
    return '+' + clean;
  }
  // If starts with 0 (e.g. 07XXXXXXXX)
  if (clean.startsWith('0')) {
    return '+256' + clean.substring(1);
  }
  // If starts with 7 (e.g. 7XXXXXXXX)
  if (clean.startsWith('7')) {
    return '+256' + clean;
  }
  return clean;
}

export function formatUgandanPhoneDisplay(input: string): string {
  const norm = normalizeUgandanPhone(input);
  if (norm.startsWith('+256') && norm.length >= 13) {
    // Format: +256 7XX XXX XXX
    const code = norm.substring(0, 4);
    const part1 = norm.substring(4, 7);
    const part2 = norm.substring(7, 10);
    const part3 = norm.substring(10);
    return `${code} ${part1} ${part2} ${part3}`.trim();
  }
  return input;
}

export function isValidUgandanPhone(input: string): boolean {
  if (!input) return false;
  const norm = normalizeUgandanPhone(input);
  // Ugandan mobile numbers in international format are +256 followed by 9 digits (total 13 chars)
  // Usually starts with +256 7X (e.g. 70, 71, 72, 74, 75, 76, 77, 78, 79)
  return /^\+256[7839]\d{8}$/.test(norm);
}

export function getWhatsAppUrl(phone: string, text?: string): string {
  const norm = normalizeUgandanPhone(phone).replace('+', '');
  const encodedText = text ? encodeURIComponent(text) : '';
  return `https://wa.me/${norm}${encodedText ? `?text=${encodedText}` : ''}`;
}

export function getTelUrl(phone: string): string {
  const norm = normalizeUgandanPhone(phone);
  return `tel:${norm}`;
}
