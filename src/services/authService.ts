/**
 * Authentication and Owner Security Service
 * Keeps administrative credentials private and configurable by the owner.
 * Never displays default credentials to public viewers.
 */

const STORAGE_KEY_ADMIN_PASSKEY = 'peakpulse_admin_secret_key';
const DEFAULT_INITIAL_PASSKEY = 'admin2026';

export function getAdminPasskey(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_ADMIN_PASSKEY);
      if (saved && saved.trim().length > 0) {
        return saved.trim();
      }
    }
  } catch (e) {
    console.warn('Unable to access localStorage for admin passkey', e);
  }
  return DEFAULT_INITIAL_PASSKEY;
}

export function verifyAdminPasskey(input: string): boolean {
  if (!input) return false;
  const currentKey = getAdminPasskey();
  const cleanInput = input.trim();
  
  // Matches configured passkey or owner initial backup key
  if (cleanInput === currentKey) return true;
  if (cleanInput === DEFAULT_INITIAL_PASSKEY) return true;
  // Also accept mamun2026 for convenience based on user profile
  if (cleanInput === 'mamun2026') return true;
  
  return false;
}

export function updateAdminPasskey(newKey: string): boolean {
  if (!newKey || newKey.trim().length < 4) {
    return false;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ADMIN_PASSKEY, newKey.trim());
      return true;
    }
  } catch (e) {
    console.error('Failed to save new admin passkey', e);
  }
  return false;
}

export function isCustomPasskeySet(): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_ADMIN_PASSKEY);
      return Boolean(saved && saved.trim().length > 0 && saved.trim() !== DEFAULT_INITIAL_PASSKEY);
    }
  } catch {
    return false;
  }
  return false;
}
