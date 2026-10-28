/**
 * Local Cookie & Storage DB for Flow-chart maker.
 * Provides persistent storage without requiring any backend database or env variables.
 */

import { FlowchartConfig } from '../types';

const COOKIE_PREFIX = 'fcm_draft_';
const MAX_SAVED_DRAFTS = 5;

// Cookie helper functions
export function setCookie(name: string, value: string, days: number = 365): void {
  try {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = '; expires=' + date.toUTCString();
    // Use encodeURIComponent to safely store UTF-8 characters including Bengali and punctuation
    const encoded = encodeURIComponent(value);
    document.cookie = `${name}=${encoded}${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('Cookie write failed:', e);
  }
}

export function getCookie(name: string): string | null {
  try {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
  } catch (e) {
    console.warn('Cookie read failed:', e);
  }
  return null;
}

export function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export interface SavedDraft {
  id: string;
  name: string;
  timestamp: number;
  config: FlowchartConfig;
}

// Local Cookie DB Service
export const LocalCookieDb = {
  // Save active flowchart
  saveActiveFlowchart(config: FlowchartConfig): void {
    const serialized = JSON.stringify(config);
    // 1. Save in Cookie
    setCookie('fcm_active_flowchart', serialized, 365);
    // 2. Also mirror in localStorage for maximum reliability
    try {
      localStorage.setItem('fcm_active_flowchart', serialized);
    } catch {}
  },

  // Load active flowchart
  loadActiveFlowchart(): FlowchartConfig | null {
    // Check cookie first
    const fromCookie = getCookie('fcm_active_flowchart');
    if (fromCookie) {
      try {
        return JSON.parse(fromCookie);
      } catch {}
    }
    // Fallback to localStorage
    try {
      const fromStorage = localStorage.getItem('fcm_active_flowchart');
      if (fromStorage) {
        return JSON.parse(fromStorage);
      }
    } catch {}
    return null;
  },

  // Get all saved drafts from cookie DB
  getAllDrafts(): SavedDraft[] {
    const drafts: SavedDraft[] = [];
    try {
      const cookieData = getCookie('fcm_saved_drafts');
      if (cookieData) {
        const parsed = JSON.parse(cookieData);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}

    try {
      const storageData = localStorage.getItem('fcm_saved_drafts');
      if (storageData) {
        const parsed = JSON.parse(storageData);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}

    return drafts;
  },

  // Save a new draft snapshot into cookie DB
  saveDraftSnapshot(name: string, config: FlowchartConfig): SavedDraft[] {
    const existing = this.getAllDrafts();
    const newDraft: SavedDraft = {
      id: 'draft_' + Date.now(),
      name: name.trim() || 'Flowchart ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      config,
    };

    // Keep the most recent drafts up to MAX_SAVED_DRAFTS
    const updated = [newDraft, ...existing.filter((d) => d.name !== newDraft.name)].slice(0, MAX_SAVED_DRAFTS);
    const serialized = JSON.stringify(updated);

    setCookie('fcm_saved_drafts', serialized, 365);
    try {
      localStorage.setItem('fcm_saved_drafts', serialized);
    } catch {}

    return updated;
  },

  // Delete a draft from cookie DB
  deleteDraft(id: string): SavedDraft[] {
    const existing = this.getAllDrafts();
    const updated = existing.filter((d) => d.id !== id);
    const serialized = JSON.stringify(updated);

    setCookie('fcm_saved_drafts', serialized, 365);
    try {
      localStorage.setItem('fcm_saved_drafts', serialized);
    } catch {}

    return updated;
  },
};
