import { useMemo, useSyncExternalStore } from "react";
import type { AxiosInstance } from "axios";

const ADMIN_SESSION_KEY = "naijamart-admin-auth";
const ADMIN_SESSION_CHANGE_EVENT = "naijamart-admin-auth-change";
const EMPTY_ADMIN_SNAPSHOT = "";
const VENDOR_SESSION_KEY = "naijamart-vendor-auth";
const VENDOR_SESSION_CHANGE_EVENT = "naijamart-vendor-auth-change";
const EMPTY_VENDOR_SNAPSHOT = "";

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
};

export type AdminSession = {
  accessToken: string;
  user: AdminUser;
};

export type VendorSession = {
  accessToken: string;
  user: AdminUser & { role: "VENDOR" };
};

export type VendorProfile = {
  id: string;
  businessName: string;
  businessType: "ARTISAN" | "VENDOR";
  description: string;
  businessEmail: string | null;
  businessPhone: string | null;
  addressLine: string;
  city: string;
  state: string;
  registrationNumber: string | null;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedAt: string | null;
};

export type VendorProfileSubmission = Omit<
  VendorProfile,
  "id" | "verificationStatus" | "submittedAt"
> & { verificationAcknowledged: boolean };

export type AdminVendorApplication = VendorProfile & {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
};

export type AdminProduct = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  rating: number | string;
  reviews: number;
  badge?: string | null;
  stock: number;
  sku: string;
  images: string[];
  details: string[];
  options?: { label: string; values: string[] }[] | null;
  originCity?: string | null;
  originState: string;
  isFlashSale: boolean;
  categoryId: string;
  category?: { id: string; name: string };
  vendor?: {
    firstName: string;
    lastName: string;
    vendorProfile?: { businessName: string } | null;
  } | null;
  createdAt: string;
};

export type AdminCategory = {
  id: string;
  name: string;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  totalAmount: number | string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string; phone?: string | null };
  items: {
    id: string;
    quantity: number;
    status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    product: {
      name: string;
      vendor?: {
        firstName: string;
        lastName: string;
        vendorProfile?: { businessName: string } | null;
      } | null;
    };
  }[];
  shippingAddress?: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
  };
  transaction?: { status: string; gateway: string } | null;
};

export type AdminDirectoryUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
  isVerified: boolean;
  createdAt: string;
  _count: { orders: number; products: number };
};

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

export function readAdminSession(): AdminSession | null {
  return parseAdminSession(readAdminSnapshot());
}

function readAdminSnapshot() {
  try {
    return (
      window.localStorage.getItem(ADMIN_SESSION_KEY) ?? EMPTY_ADMIN_SNAPSHOT
    );
  } catch (error) {
    console.error("Could not read the admin session.", error);
    return EMPTY_ADMIN_SNAPSHOT;
  }
}

function parseAdminSession(serialized: string): AdminSession | null {
  try {
    if (!serialized) return null;
    const session: unknown = JSON.parse(serialized);
    if (
      typeof session === "object" &&
      session !== null &&
      "accessToken" in session &&
      typeof session.accessToken === "string" &&
      "user" in session &&
      typeof session.user === "object" &&
      session.user !== null &&
      "role" in session.user &&
      session.user.role === "ADMIN"
    ) {
      return session as AdminSession;
    }
    return null;
  } catch (error) {
    console.error("Could not parse the admin session.", error);
    return null;
  }
}

function subscribeToAdminSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(ADMIN_SESSION_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(ADMIN_SESSION_CHANGE_EVENT, onChange);
  };
}

export function useAdminSession() {
  const snapshot = useSyncExternalStore(
    subscribeToAdminSession,
    readAdminSnapshot,
    () => EMPTY_ADMIN_SNAPSHOT,
  );
  return useMemo(() => parseAdminSession(snapshot), [snapshot]);
}

function subscribeToNothing() {
  return () => {};
}

export function useClientReady() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

export function saveAdminSession(session: AdminSession) {
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(ADMIN_SESSION_CHANGE_EVENT));
}

export function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new Event(ADMIN_SESSION_CHANGE_EVENT));
}

export function readVendorSession(): VendorSession | null {
  return parseVendorSession(readVendorSnapshot());
}

function readVendorSnapshot() {
  try {
    return (
      window.localStorage.getItem(VENDOR_SESSION_KEY) ?? EMPTY_VENDOR_SNAPSHOT
    );
  } catch (error) {
    console.error("Could not read the vendor session.", error);
    return EMPTY_VENDOR_SNAPSHOT;
  }
}

function parseVendorSession(serialized: string): VendorSession | null {
  try {
    if (!serialized) return null;
    const session: unknown = JSON.parse(serialized);
    if (
      typeof session === "object" &&
      session !== null &&
      "accessToken" in session &&
      typeof session.accessToken === "string" &&
      "user" in session &&
      typeof session.user === "object" &&
      session.user !== null &&
      "role" in session.user &&
      session.user.role === "VENDOR"
    ) {
      return session as VendorSession;
    }
    return null;
  } catch (error) {
    console.error("Could not parse the vendor session.", error);
    return null;
  }
}

function subscribeToVendorSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(VENDOR_SESSION_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(VENDOR_SESSION_CHANGE_EVENT, onChange);
  };
}

export function useVendorSession() {
  const snapshot = useSyncExternalStore(
    subscribeToVendorSession,
    readVendorSnapshot,
    () => EMPTY_VENDOR_SNAPSHOT,
  );
  return useMemo(() => parseVendorSession(snapshot), [snapshot]);
}

export function saveVendorSession(session: VendorSession) {
  window.localStorage.setItem(VENDOR_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(VENDOR_SESSION_CHANGE_EVENT));
}

export function clearVendorSession() {
  window.localStorage.removeItem(VENDOR_SESSION_KEY);
  window.dispatchEvent(new Event(VENDOR_SESSION_CHANGE_EVENT));
}

export async function vendorSignUp(
  api: AxiosInstance,
  payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  },
): Promise<VendorSession> {
  const { data: result } = await api.post<unknown>("/auth/vendor-signup", payload);
  if (
    typeof result !== "object" ||
    result === null ||
    !("accessToken" in result) ||
    typeof result.accessToken !== "string" ||
    !("user" in result) ||
    typeof result.user !== "object" ||
    result.user === null ||
    !("role" in result.user) ||
    result.user.role !== "VENDOR"
  ) {
    throw new AdminApiError(
      "The API returned an invalid signup response.",
      502,
    );
  }
  return result as VendorSession;
}

export async function adminSignIn(
  api: AxiosInstance,
  email: string,
  password: string,
) {
  const { data: payload } = await api.post<unknown>("/auth/signin", {
    email,
    password,
  });
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("accessToken" in payload) ||
    typeof payload.accessToken !== "string" ||
    !("user" in payload) ||
    typeof payload.user !== "object" ||
    payload.user === null ||
    !("role" in payload.user)
  ) {
    throw new AdminApiError(
      "The API returned an invalid sign-in response.",
      502,
    );
  }
  if (payload.user.role !== "ADMIN") {
    throw new AdminApiError(
      "This account does not have administrator access. Use an existing admin account.",
      403,
    );
  }
  return payload as AdminSession;
}

export async function vendorSignIn(
  api: AxiosInstance,
  email: string,
  password: string,
): Promise<VendorSession> {
  const { data: payload } = await api.post<unknown>("/auth/signin", {
    email,
    password,
  });
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("accessToken" in payload) ||
    typeof payload.accessToken !== "string" ||
    !("user" in payload) ||
    typeof payload.user !== "object" ||
    payload.user === null ||
    !("role" in payload.user) ||
    payload.user.role !== "VENDOR"
  ) {
    throw new AdminApiError(
      "This account does not have vendor access. Please use a seller account.",
      403,
    );
  }
  return payload as VendorSession;
}

async function authenticatedRequest<T>(
  api: AxiosInstance,
  path: string,
  options: { method?: string; body?: string } = {},
  session: { accessToken: string } | null,
  missingSessionMessage: string,
): Promise<T> {
  if (!session) {
    throw new AdminApiError(missingSessionMessage, 401);
  }

  const { data } = await api.request<T>({
    url: path,
    method: options.method ?? "GET",
    data: options.body ? JSON.parse(options.body) : undefined,
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  return data;
}

export function adminRequest<T>(
  api: AxiosInstance,
  path: string,
  options: { method?: string; body?: string } = {},
): Promise<T> {
  return authenticatedRequest(
    api,
    path,
    options,
    readAdminSession(),
    "Please sign in with an administrator account.",
  );
}

export function vendorRequest<T>(
  api: AxiosInstance,
  path: string,
  options: { method?: string; body?: string } = {},
): Promise<T> {
  return authenticatedRequest(
    api,
    path,
    options,
    readVendorSession(),
    "Please sign in with your vendor account.",
  );
}
