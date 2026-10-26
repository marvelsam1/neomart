"use client";

import { useMemo, useSyncExternalStore } from "react";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

const AUTH_STORAGE_KEY = "naijamart-auth";
const AUTH_CHANGE_EVENT = "naijamart-auth-change";
const EMPTY_SNAPSHOT = "";
let memorySnapshot = EMPTY_SNAPSHOT;
let hasLoggedStorageError = false;

function getSnapshot() {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  try {
    memorySnapshot = window.localStorage.getItem(AUTH_STORAGE_KEY) ?? EMPTY_SNAPSHOT;
  } catch (error) {
    if (!hasLoggedStorageError) {
      console.error("Could not read the saved Neomart sign-in session.", error);
      hasLoggedStorageError = true;
    }
  }
  return memorySnapshot;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(AUTH_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
  };
}

function parseSnapshot(snapshot: string): AuthSession | null {
  if (!snapshot) return null;
  try {
    const value: unknown = JSON.parse(snapshot);
    if (
      typeof value === "object" &&
      value !== null &&
      "accessToken" in value &&
      typeof value.accessToken === "string" &&
      "user" in value &&
      typeof value.user === "object" &&
      value.user !== null &&
      "id" in value.user &&
      typeof value.user.id === "string" &&
      "email" in value.user &&
      typeof value.user.email === "string" &&
      "firstName" in value.user &&
      typeof value.user.firstName === "string" &&
      "lastName" in value.user &&
      typeof value.user.lastName === "string" &&
      "role" in value.user &&
      (value.user.role === "CUSTOMER" ||
        value.user.role === "VENDOR" ||
        value.user.role === "ADMIN")
    ) {
      return value as AuthSession;
    }
    console.error("The saved Neomart sign-in session has an invalid format.");
  } catch (error) {
    console.error("Could not parse the saved Neomart sign-in session.", error);
  }
  return null;
}

export function saveAuthSession(session: AuthSession) {
  memorySnapshot = JSON.stringify(session);
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, memorySnapshot);
  } catch (error) {
    console.error("Could not save the Neomart sign-in session.", error);
  }
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearAuthSession() {
  memorySnapshot = EMPTY_SNAPSHOT;
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error("Could not clear the Neomart sign-in session.", error);
  }
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function useAuthSession() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SNAPSHOT);
  return useMemo(() => parseSnapshot(snapshot), [snapshot]);
}

export function getAccessToken() {
  return parseSnapshot(getSnapshot())?.accessToken ?? null;
}
