import { Platform } from 'react-native';

const TOKEN_KEY = 'closeby_auth_token';
const USER_KEY = 'closeby_auth_user';

let memoryToken: string | null = null;
let memoryUser: string | null = null;

export const authStorage = {
  getToken(): string | null {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        return window.localStorage.getItem(TOKEN_KEY);
      } catch {
        return memoryToken;
      }
    }
    return memoryToken;
  },

  setToken(token: string | null): void {
    memoryToken = token;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (token) {
          window.localStorage.setItem(TOKEN_KEY, token);
        } else {
          window.localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        // Ignore private browsing storage restrictions
      }
    }
  },

  getUserJson(): string | null {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        return window.localStorage.getItem(USER_KEY);
      } catch {
        return memoryUser;
      }
    }
    return memoryUser;
  },

  setUserJson(json: string | null): void {
    memoryUser = json;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (json) {
          window.localStorage.setItem(USER_KEY, json);
        } else {
          window.localStorage.removeItem(USER_KEY);
        }
      } catch {
        // Ignore private browsing storage restrictions
      }
    }
  },

  clear(): void {
    this.setToken(null);
    this.setUserJson(null);
  },
};
