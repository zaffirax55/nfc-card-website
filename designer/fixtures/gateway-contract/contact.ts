// Shared by the browser, website server and gateway; no server-only dependencies.
export const contactMethods = ['phone', 'telegram', 'email'] as const;
export type PreferredContact = typeof contactMethods[number];
export function normalizePhone(value: string): string | undefined {
  const phone = value.trim();
  if (phone.length > 50 || !/^\+?[0-9\s()-]+$/.test(phone)) return;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return;
  return (phone.startsWith('+') ? '+' : '') + digits;
}
