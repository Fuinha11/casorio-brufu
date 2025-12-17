/**
 * Guest Authentication System
 * Handles login, validation, and session management for wedding website
 */

// Google Apps Script API URL
const API_URL = 'https://script.google.com/macros/s/AKfycbwc_-5VTNA5E0CuQXUwPwqJxRdtGUSAVF8Hg-A6q_46biVHTipP2wb2LY_Ch1PeDVL7/exec';

interface Guest {
  name: string;
  code: string;
  isPlusOne: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  guestName: string | null;
  guestCode: string | null;
  isPlusOne: boolean;
}

interface LoginResponse {
  success: boolean;
  guest?: Guest;
  error?: string;
}

const STORAGE_KEYS = {
  GUEST_NAME: 'guestName',
  GUEST_CODE: 'guestCode',
  IS_PLUS_ONE: 'isPlusOne',
  IS_AUTHENTICATED: 'isAuthenticated'
} as const;

/**
 * Get the base path for the site (handles GitHub Pages subdirectory)
 */
function getBasePath(): string {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/casorio-brufu')) {
    return '/casorio-brufu';
  }
  return '';
}

/**
 * Validate a guest code against Google Sheets via Apps Script
 */
export async function validateGuestCode(code: string): Promise<Guest | null> {
  try {
    const response = await fetch(`${API_URL}?action=login&code=${encodeURIComponent(code)}`);
    const data: LoginResponse = await response.json();

    if (data.success && data.guest) {
      return data.guest;
    }
    return null;
  } catch (error) {
    console.error('Error validating guest code:', error);
    return null;
  }
}

/**
 * Log in a guest by storing their info in localStorage
 */
export function loginGuest(guest: Guest): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEYS.GUEST_NAME, guest.name);
  localStorage.setItem(STORAGE_KEYS.GUEST_CODE, guest.code);
  localStorage.setItem(STORAGE_KEYS.IS_PLUS_ONE, guest.isPlusOne ? 'true' : 'false');
  localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
}

/**
 * Log out the current guest
 */
export function logoutGuest(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.GUEST_NAME);
  localStorage.removeItem(STORAGE_KEYS.GUEST_CODE);
  localStorage.removeItem(STORAGE_KEYS.IS_PLUS_ONE);
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
      guestCode: null,
      isPlusOne: false
    };
  }

  const isAuthenticated = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
  const guestName = localStorage.getItem(STORAGE_KEYS.GUEST_NAME);
  const guestCode = localStorage.getItem(STORAGE_KEYS.GUEST_CODE);
  const isPlusOne = localStorage.getItem(STORAGE_KEYS.IS_PLUS_ONE) === 'true';

  return {
    isAuthenticated: isAuthenticated && !!guestCode,
    guestName,
    guestCode,
    isPlusOne
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
 * Check if current guest is a plus one
 */
export function isPlusOne(): boolean {
  return getAuthState().isPlusOne;
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
 * Get the API URL for making requests
 */
export function getApiUrl(): string {
  return API_URL;
}

/**
 * Build a form URL with pre-filled guest info
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
