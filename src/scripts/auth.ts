/**
 * Guest Authentication System
 * Handles login, validation, and session management for wedding website
 */

interface Guest {
  name: string;
  code: string;
}

interface AuthState {
  isAuthenticated: boolean;
  guestName: string | null;
  guestCode: string | null;
}

const STORAGE_KEYS = {
  GUEST_NAME: 'guestName',
  GUEST_CODE: 'guestCode',
  IS_AUTHENTICATED: 'isAuthenticated'
} as const;

/**
 * Get the base path for the site (handles GitHub Pages subdirectory)
 */
function getBasePath(): string {
  // Check if we're on GitHub Pages
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/casorio-brufu')) {
    return '/casorio-brufu';
  }
  return '';
}

/**
 * Fetch the guest list from the JSON file
 */
async function fetchGuestList(): Promise<Guest[]> {
  try {
    const basePath = getBasePath();
    const response = await fetch(`${basePath}/data/guests.json`);
    if (!response.ok) {
      throw new Error('Failed to fetch guest list');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching guest list:', error);
    return [];
  }
}

/**
 * Validate a guest code against the guest list
 */
export async function validateGuestCode(code: string): Promise<Guest | null> {
  const guests = await fetchGuestList();
  const normalizedCode = code.toLowerCase().trim();

  const guest = guests.find(g => g.code.toLowerCase() === normalizedCode);
  return guest || null;
}

/**
 * Log in a guest by storing their info in localStorage
 */
export function loginGuest(guest: Guest): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEYS.GUEST_NAME, guest.name);
  localStorage.setItem(STORAGE_KEYS.GUEST_CODE, guest.code);
  localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
}

/**
 * Log out the current guest
 */
export function logoutGuest(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.GUEST_NAME);
  localStorage.removeItem(STORAGE_KEYS.GUEST_CODE);
  localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
}

/**
 * Get the current authentication state
 */
export function getAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return {
      isAuthenticated: false,
      guestName: null,
      guestCode: null
    };
  }

  const isAuthenticated = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
  const guestName = localStorage.getItem(STORAGE_KEYS.GUEST_NAME);
  const guestCode = localStorage.getItem(STORAGE_KEYS.GUEST_CODE);

  return {
    isAuthenticated: isAuthenticated && !!guestName && !!guestCode,
    guestName,
    guestCode
  };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthState().isAuthenticated;
}

/**
 * Get the current guest's name
 */
export function getGuestName(): string | null {
  return getAuthState().guestName;
}

/**
 * Get the current guest's code
 */
export function getGuestCode(): string | null {
  return getAuthState().guestCode;
}

/**
 * Redirect to login page if not authenticated
 */
export function requireAuth(): void {
  if (typeof window === 'undefined') return;

  if (!isAuthenticated()) {
    const basePath = getBasePath();
    window.location.href = `${basePath}/login`;
  }
}

/**
 * Redirect to home page if already authenticated
 */
export function redirectIfAuthenticated(): void {
  if (typeof window === 'undefined') return;

  if (isAuthenticated()) {
    const basePath = getBasePath();
    window.location.href = `${basePath}/`;
  }
}

/**
 * Handle login form submission
 */
export async function handleLogin(code: string): Promise<{ success: boolean; error?: string }> {
  const guest = await validateGuestCode(code);

  if (guest) {
    loginGuest(guest);
    return { success: true };
  }

  return {
    success: false,
    error: 'Codigo invalido. Verifique o codigo no seu convite.'
  };
}

/**
 * Build a form URL with pre-filled guest info
 * @param baseUrl The base URL of the Google Form
 * @param codeFieldId The entry ID for the code field (e.g., "entry.123456")
 * @param nameFieldId The entry ID for the name field (e.g., "entry.789012")
 */
export function buildFormUrl(
  baseUrl: string,
  codeFieldId: string,
  nameFieldId: string
): string {
  const { guestCode, guestName } = getAuthState();

  if (!guestCode || !guestName) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  url.searchParams.set(codeFieldId, guestCode);
  url.searchParams.set(nameFieldId, guestName);

  return url.toString();
}
