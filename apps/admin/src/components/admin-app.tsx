"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  adminRequest,
  adminSignIn,
  clearAdminSession,
  clearVendorSession,
  saveAdminSession,
  useAdminSession,
  useClientReady,
  useVendorSession,
  vendorRequest,
  type VendorProfile,
  type AdminCategory,
  type AdminDirectoryUser,
  type AdminOrder,
  type AdminProduct,
  type AdminVendorApplication,
} from "@/lib/admin-api";
import { getApiErrorMessage, useApi } from "@/lib/api-provider";
import {
  VendorOnboardingPage,
  VendorLoginPage,
  VendorSignupPage,
} from "@/components/vendor-onboarding";

const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

type AdminScreenName =
  | "products"
  | "marketing"
  | "orders"
  | "customers"
  | "vendors";

const navigation: {
  href: string;
  label: string;
  icon: string;
  screen: AdminScreenName;
}[] = [
  { href: "/products", label: "Products", icon: "▦", screen: "products" },
  { href: "/marketing", label: "Marketing", icon: "✳", screen: "marketing" },
  { href: "/orders", label: "Orders", icon: "▤", screen: "orders" },
  { href: "/customers", label: "Customers", icon: "♙", screen: "customers" },
  { href: "/vendors", label: "Vendors", icon: "◇", screen: "vendors" },
];

const orderStatuses: AdminOrder["status"][] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function money(value: number | string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function date(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function AdminLogin() {
  const router = useRouter();
  const api = useApi();
  const [message, setMessage] = useState("");
  const signIn = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) =>
      adminSignIn(api, credentials.email, credentials.password),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const session = await signIn.mutateAsync({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      });
      clearVendorSession();
      saveAdminSession(session);
      router.replace("/products");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not sign in. Please try again."));
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-mark">N</div>
        <span className="admin-kicker">NAIJAMART · OPERATIONS</span>
        <h1>Welcome back.</h1>
        <p>
          Sign in with your administrator account to manage the marketplace.
        </p>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Work email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {message && (
            <p className="admin-alert error" role="alert">
              {message}
            </p>
          )}
          <button className="admin-primary-button" disabled={signIn.isPending}>
            {signIn.isPending ? "Signing in…" : "Sign in to admin"}
          </button>
        </form>
        <Link className="admin-login-store" href={STOREFRONT_URL}>
          ← Return to the storefront
        </Link>
        <Link className="admin-login-store" href="/vendor-login">
          Seller? Sign in to your vendor account
        </Link>
      </section>
      <div className="admin-login-aside">
        <div className="admin-aside-top">
          N<span>·</span>M
        </div>
        <div>
          <span className="admin-kicker">A MARKETPLACE WITH MEANING</span>
          <h2>
            Good things,
            <br />
            growing together.
          </h2>
          <p>
            One home for the makers, customers and stories that make Neomart.
          </p>
        </div>
        <span className="admin-aside-foot">
          MADE WITH CARE · ROOTED IN NIGERIA
        </span>
      </div>
    </main>
  );
}

export function AdminApplication({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const api = useApi();
  const session = useAdminSession();
  const vendorSession = useVendorSession();
  const ready = useClientReady();
  const vendorDashboardRoutes = ["/products", "/marketing", "/orders", "/customers"];
  const isVendorDashboardRoute = vendorDashboardRoutes.includes(pathname);
  const vendorProfileQuery = useQuery({
    queryKey: ["vendor", "profile"],
    queryFn: () =>
      vendorRequest<VendorProfile | null>(
        api,
        "/vendors/me/profile",
      ),
    enabled: Boolean(vendorSession && isVendorDashboardRoute),
  });
  const isLogin = pathname === "/login";
  const isVendorSignup = pathname === "/signup";
  const isVendorLogin = pathname === "/vendor-login";
  const isVendorOnboarding = pathname === "/onboarding";
  const isVendorRoute = isVendorSignup || isVendorLogin || isVendorOnboarding;

  useEffect(() => {
    if (isVendorRoute) {
      if (vendorSession && isVendorSignup) router.replace("/onboarding");
      if (vendorSession && isVendorLogin) router.replace("/onboarding");
      if (!vendorSession && isVendorOnboarding) router.replace("/signup");
      return;
    }

    if (vendorSession && pathname === "/vendors") {
      router.replace("/products");
      return;
    }
    if (
      vendorSession &&
      isVendorDashboardRoute &&
      vendorProfileQuery.isSuccess &&
      vendorProfileQuery.data?.verificationStatus !== "APPROVED"
    ) {
      router.replace("/onboarding");
      return;
    }
    if (!session && !vendorSession && pathname !== "/login") router.replace("/login");
    if (session && pathname === "/login") router.replace("/products");
  }, [
    isVendorOnboarding,
    isVendorLogin,
    isVendorRoute,
    isVendorDashboardRoute,
    isVendorSignup,
    pathname,
    router,
    session,
    vendorSession,
    vendorProfileQuery.data,
    vendorProfileQuery.isSuccess,
  ]);

  function signOut() {
    clearAdminSession();
    router.replace("/login");
  }

  if (isVendorSignup) return <VendorSignupPage />;
  if (isVendorLogin) return <VendorLoginPage />;
  if (isVendorOnboarding && ready && vendorSession) {
    return <VendorOnboardingPage session={vendorSession} />;
  }
  if (isVendorOnboarding && !ready) {
    return (
      <main className="admin-loading">
        <span className="admin-spinner" />
        <span>Opening seller setup…</span>
      </main>
    );
  }
  if (vendorSession && isVendorDashboardRoute) {
    if (!ready || vendorProfileQuery.isPending) {
      return (
        <main className="admin-loading">
          <span className="admin-spinner" />
          <span>Checking your seller access…</span>
        </main>
      );
    }
    if (
      vendorProfileQuery.isError ||
      vendorProfileQuery.data?.verificationStatus !== "APPROVED"
    ) {
      return (
        <main className="admin-loading">
          <span className="admin-spinner" />
          <span>
            {vendorProfileQuery.isError
              ? getApiErrorMessage(
                  vendorProfileQuery.error,
                  "Could not verify seller access.",
                )
              : "Opening seller verification…"}
          </span>
        </main>
      );
    }
    return (
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <Link href="/products" className="admin-brand">
            <span className="admin-brand-mark">N</span>
            <span>
              neo<span>mart</span>
              <small>SELLER STUDIO</small>
            </span>
          </Link>
          <div className="admin-workspace-label">SELLER WORKSPACE</div>
          <nav className="admin-nav" aria-label="Seller navigation">
            {navigation
              .filter((item) => item.screen !== "vendors")
              .map((item) => (
                <Link
                  className={`admin-nav-link${pathname === item.href ? " active" : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  <span>{item.screen === "customers" ? "My customers" : item.label}</span>
                </Link>
              ))}
          </nav>
          <div className="admin-sidebar-bottom">
            <div className="admin-profile">
              <span className="admin-avatar">
                {vendorSession.user.firstName[0]}
                {vendorSession.user.lastName[0]}
              </span>
              <span className="admin-profile-name">
                {vendorSession.user.firstName} {vendorSession.user.lastName}
                <small>Verified seller</small>
              </span>
              <button
                type="button"
                className="admin-logout"
                onClick={() => {
                  clearVendorSession();
                  router.replace("/vendor-login");
                }}
                aria-label="Sign out"
              >
                ↗
              </button>
            </div>
          </div>
        </aside>
        <main className="admin-main">
          <header className="admin-topbar">
            <div className="admin-breadcrumb">
              Seller Studio <span>/</span>{" "}
              {navigation.find((item) => item.href === pathname)?.label ?? "Workspace"}
            </div>
            <div className="admin-top-actions">
              <span className="admin-live-indicator"><i /> Storefront live</span>
              <a href={STOREFRONT_URL} target="_blank" rel="noreferrer">View store ↗</a>
            </div>
          </header>
          <div className="admin-content">{children}</div>
        </main>
      </div>
    );
  }
  if (isLogin) return <AdminLogin />;
  if (!ready || !session) {
    return (
      <main className="admin-loading">
        <span className="admin-spinner" />
        <span>Opening your workspace…</span>
      </main>
    );
  }

  const activeItem = navigation.find((item) => item.href === pathname);
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link href="/products" className="admin-brand">
          <span className="admin-brand-mark">N</span>
          <span>
            naija<span>mart</span>
            <small>ADMIN STUDIO</small>
          </span>
        </Link>
        <div className="admin-workspace-label">WORKSPACE</div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navigation.map((item) => (
            <Link
              className={`admin-nav-link${pathname === item.href ? " active" : ""}`}
              href={item.href}
              key={item.href}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.screen === "orders" && <span className="admin-nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-help-card">
            <span className="admin-help-icon">✦</span>
            <strong>Need a hand?</strong>
            <span>Your marketplace team is just a message away.</span>
            <a href="mailto:support@neomart.com">
              Get support <span>↗</span>
            </a>
          </div>
          <div className="admin-profile">
            <span className="admin-avatar">
              {session.user.firstName[0]}
              {session.user.lastName[0]}
            </span>
            <span className="admin-profile-name">
              {session.user.firstName} {session.user.lastName}
              <small>Administrator</small>
            </span>
            <button
              type="button"
              className="admin-logout"
              onClick={signOut}
              aria-label="Sign out"
            >
              ↗
            </button>
          </div>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            Neomart <span>/</span> {activeItem?.label ?? "Workspace"}
          </div>
          <div className="admin-top-actions">
            <span className="admin-live-indicator">
              <i /> Storefront live
            </span>
            <a href="http://localhost:3000" target="_blank" rel="noreferrer">
              View store ↗
            </a>
            <button
              type="button"
              className="admin-notification"
              aria-label="Notifications"
            >
              ♧<i />
            </button>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}

function ScreenHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-screen-header">
      <div>
        <div className="admin-kicker">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "default" | "orange" | "green";
}) {
  return (
    <article className={`admin-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function LoadingLine() {
  return (
    <div className="admin-loading-inline">
      <span className="admin-spinner" /> Loading live data…
    </div>
  );
}

function ApiNotice({ error, retry }: { error: string; retry: () => void }) {
  return (
    <div className="admin-alert error">
      <span>{error}</span>
      <button type="button" onClick={retry}>
        Try again
      </button>
    </div>
  );
}

type AdminScreenData = {
  products?: AdminProduct[];
  categories?: AdminCategory[];
  orders?: AdminOrder[];
  users?: AdminDirectoryUser[];
  vendorApplications?: AdminVendorApplication[];
};

const EMPTY_PRODUCTS: AdminProduct[] = [];
const EMPTY_CATEGORIES: AdminCategory[] = [];
const EMPTY_ORDERS: AdminOrder[] = [];
const EMPTY_USERS: AdminDirectoryUser[] = [];
const EMPTY_VENDOR_APPLICATIONS: AdminVendorApplication[] = [];

export function AdminScreen({ screen }: { screen: AdminScreenName }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const vendorSession = useVendorSession();
  const isVendor = Boolean(vendorSession);
  function authorizedRequest<T>(
    path: string,
    options?: { method?: string; body?: string },
  ) {
    return isVendor
      ? vendorRequest<T>(api, path, options)
      : adminRequest<T>(api, path, options);
  }
  const dataQuery = useQuery({
    queryKey: ["admin-screen", screen, isVendor ? "vendor" : "admin"],
    queryFn: async (): Promise<AdminScreenData> => {
      if (screen === "products" || screen === "marketing") {
        const [productResponse, categoryResponse] = await Promise.all([
          authorizedRequest<{ data: AdminProduct[] }>(
            "/products/vendor/me",
          ),
          api.get<AdminCategory[]>("/categories").then((response) => response.data),
        ]);
        return {
          products: productResponse.data,
          categories: categoryResponse,
        };
      }
      if (screen === "orders") {
        return { orders: await authorizedRequest<AdminOrder[]>("/orders") };
      }
      if (screen === "customers") {
        if (isVendor) {
          return {
            users: await vendorRequest<AdminDirectoryUser[]>(
              api,
              "/vendors/me/customers",
            ),
          };
        }
        return {
          users: await adminRequest<AdminDirectoryUser[]>(api, "/users"),
        };
      }
      return {
        vendorApplications: await adminRequest<AdminVendorApplication[]>(
          api,
          "/vendors",
        ),
      };
    },
    enabled: !isVendor || screen !== "vendors",
  });
  const products = dataQuery.data?.products ?? EMPTY_PRODUCTS;
  const categories = dataQuery.data?.categories ?? EMPTY_CATEGORIES;
  const orders = dataQuery.data?.orders ?? EMPTY_ORDERS;
  const users = dataQuery.data?.users ?? EMPTY_USERS;
  const vendorApplications =
    dataQuery.data?.vendorApplications ?? EMPTY_VENDOR_APPLICATIONS;
  const loading = dataQuery.isPending || dataQuery.isFetching;
  const error = dataQuery.isError
    ? getApiErrorMessage(dataQuery.error, "The data could not be loaded.")
    : "";
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [productModal, setProductModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const actionMutation = useMutation({
    mutationFn: async ({
      path,
      options,
    }: {
      path: string;
      options?: { method?: string; body?: string };
    }) => authorizedRequest(path, options),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["admin-screen", screen, isVendor ? "vendor" : "admin"],
      }),
  });
  const submitting = actionMutation.isPending;

  function refreshData() {
    void dataQuery.refetch();
  }

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.sku} ${product.category?.name ?? ""} ${product.vendor?.vendorProfile?.businessName ?? ""} ${product.vendor?.firstName ?? ""} ${product.vendor?.lastName ?? ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [products, search],
  );
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) =>
        `${order.orderNumber} ${order.user?.firstName ?? ""} ${order.user?.lastName ?? ""} ${order.user?.email ?? ""} ${order.items.map((item) => item.product.vendor?.vendorProfile?.businessName ?? item.product.vendor?.firstName ?? "").join(" ")}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [orders, search],
  );
  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        `${user.firstName} ${user.lastName} ${user.email} ${user.role}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [users, search],
  );
  const filteredVendorApplications = useMemo(
    () =>
      vendorApplications.filter((application) =>
        `${application.businessName} ${application.user.firstName} ${application.user.lastName} ${application.user.email} ${application.state}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [search, vendorApplications],
  );

  async function changeFlashSale(product: AdminProduct, enabled: boolean) {
    setNotice("");
    try {
      await actionMutation.mutateAsync({
        path: `/products/${product.id}`,
        options: {
          method: "PATCH",
          body: JSON.stringify({ isFlashSale: enabled }),
        },
      });
      setNotice(
        `${product.name} ${enabled ? "added to" : "removed from"} the flash sale.`,
      );
    } catch (actionError) {
      setNotice(getApiErrorMessage(actionError, "Could not update product."));
    }
  }

  async function updateOrderStatus(
    orderId: string,
    status: AdminOrder["status"],
  ) {
    setNotice("");
    try {
      await actionMutation.mutateAsync({
        path: `/orders/${orderId}/status`,
        options: {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      });
      setNotice("Order status updated.");
    } catch (actionError) {
      setNotice(getApiErrorMessage(actionError, "Could not update order."));
    }
  }

  async function updateOrderItemStatus(
    orderId: string,
    itemId: string,
    status: AdminOrder["status"],
  ) {
    setNotice("");
    try {
      await actionMutation.mutateAsync({
        path: `/orders/${orderId}/items/${itemId}/status`,
        options: {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      });
      setNotice("Product fulfillment status updated.");
    } catch (actionError) {
      setNotice(getApiErrorMessage(actionError, "Could not update fulfillment status."));
    }
  }

  async function reviewVendorApplication(
    userId: string,
    status: "APPROVED" | "REJECTED",
  ) {
    try {
      await actionMutation.mutateAsync({
        path: `/vendors/${userId}/verification`,
        options: {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      });
      setNotice(
        status === "APPROVED"
          ? "Vendor application approved."
          : "Changes requested from vendor.",
      );
    } catch (actionError) {
      setNotice(
        getApiErrorMessage(
          actionError,
          "Could not update vendor verification.",
        ),
      );
    }
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const form = new FormData(event.currentTarget);
    let images: string[];
    try {
      images = parseProductImages(String(form.get("images") ?? ""));
    } catch {
      setNotice("Enter image URLs one per line or as a valid JSON array of strings.");
      return;
    }
    if (images.length === 0) {
      setNotice("Add at least one valid product image URL.");
      return;
    }

    const payload = {
      name: String(form.get("name") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      price: Number(form.get("price")),
      compareAtPrice: String(form.get("compareAtPrice") ?? "").trim()
        ? Number(form.get("compareAtPrice"))
        : undefined,
      stock: Number(form.get("stock")),
      sku: String(form.get("sku") ?? "").trim(),
      images,
      details: String(form.get("details") ?? "")
        .split(/\r?\n/)
        .map((detail) => detail.trim())
        .filter(Boolean),
      options: String(form.get("options") ?? "")
        .split(/\r?\n/)
        .map((option) => {
          const [label, ...values] = option.split(":");
          return {
            label: label.trim(),
            values: values.join(":").split(",").map((value) => value.trim()).filter(Boolean),
          };
        })
        .filter((option) => option.label && option.values.length > 0),
      badge: String(form.get("badge") ?? "").trim() || undefined,
      originCity: String(form.get("originCity") ?? "").trim() || undefined,
      originState: String(form.get("originState") ?? "").trim(),
      isFlashSale: form.get("isFlashSale") === "on",
      categoryId: String(form.get("categoryId") ?? ""),
    };
    try {
      await actionMutation.mutateAsync({
        path: "/products",
        options: { method: "POST", body: JSON.stringify(payload) },
      });
      setProductModal(false);
      setNotice(
        "Product added. It is now available in the storefront catalog.",
      );
    } catch (actionError) {
      setNotice(getApiErrorMessage(actionError, "Could not create product."));
    }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await actionMutation.mutateAsync({
        path: "/categories",
        options: {
          method: "POST",
          body: JSON.stringify({
            name: String(form.get("categoryName") ?? "").trim(),
          }),
        },
      });
      setCategoryModal(false);
      setNotice("Category created.");
    } catch (actionError) {
      setNotice(getApiErrorMessage(actionError, "Could not create category."));
    }
  }

  function headerAction() {
    if (isVendor && screen === "products") {
      return (
        <button
          className="admin-primary-button"
          type="button"
          onClick={() => setProductModal(true)}
        >
          <span>＋</span> Add product
        </button>
      );
    }
    if (isVendor && screen === "marketing") {
      return (
        <button
          className="admin-primary-button"
          type="button"
          onClick={() => setProductModal(true)}
        >
          <span>＋</span> Add a product
        </button>
      );
    }
    return undefined;
  }

  return (
    <>
      <ScreenHeader
        eyebrow={
          screen === "products"
            ? "CATALOGUE"
            : screen === "marketing"
              ? "GROW YOUR SALES"
              : screen === "orders"
                ? "FULFILMENT"
                : screen === "vendors"
                  ? "SELLER VERIFICATION"
                  : "COMMUNITY"
        }
        title={
          screen === "products"
            ? "Products & inventory"
            : screen === "marketing"
              ? "Marketing studio"
              : screen === "orders"
                ? "Orders & fulfilment"
                : screen === "vendors"
                  ? "Vendor applications"
                  : "Customers & makers"
        }
        description={
          screen === "products"
            ? isVendor
              ? "Manage your products, details and inventory in the marketplace."
              : "Monitor products across the marketplace and identify their vendor owners."
            : screen === "marketing"
              ? isVendor
                ? "Bring your best finds into the spotlight."
                : "Monitor featured products and visibility across the marketplace."
              : screen === "orders"
                ? "Every order is a story in motion. Keep each one on its way."
                : screen === "vendors"
                  ? "Review business details and decide which sellers are ready to join the marketplace."
                  : "Get to know the people making this marketplace special."
        }
        action={headerAction()}
      />
      {notice && (
        <div
          className={`admin-alert${notice.toLowerCase().includes("could not") || notice.toLowerCase().includes("failed") ? " error" : ""}`}
          role="status"
        >
          {notice}
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      {error && <ApiNotice error={error} retry={refreshData} />}

      {screen === "products" && (
        <ProductsScreen
          loading={loading}
          products={filteredProducts}
          allProducts={products}
          search={search}
          onSearch={setSearch}
          onAdd={() => setProductModal(true)}
          onToggleFlashSale={changeFlashSale}
          onRefresh={refreshData}
          canManageProducts={isVendor}
        />
      )}
      {screen === "marketing" && (
        <MarketingScreen
          loading={loading}
          products={products}
          onToggleFlashSale={changeFlashSale}
          canManageProducts={isVendor}
          onAdd={() => setProductModal(true)}
        />
      )}
      {screen === "orders" && (
        <OrdersScreen
          loading={loading}
          orders={filteredOrders}
          allOrders={orders}
          search={search}
          onSearch={setSearch}
          onStatusChange={updateOrderStatus}
          onItemStatusChange={updateOrderItemStatus}
          vendorView={isVendor}
        />
      )}
      {screen === "customers" && (
        <CustomersScreen
          loading={loading}
          users={filteredUsers}
          allUsers={users}
          search={search}
          onSearch={setSearch}
          vendorView={isVendor}
        />
      )}
      {screen === "vendors" && (
        <VendorApplicationsScreen
          loading={loading}
          applications={filteredVendorApplications}
          allApplications={vendorApplications}
          search={search}
          onSearch={setSearch}
          onReview={reviewVendorApplication}
          submitting={submitting}
        />
      )}

      {productModal && (
        <Modal title="Add a product" onClose={() => setProductModal(false)}>
          <form
            className="admin-form admin-product-form"
            onSubmit={createProduct}
          >
            <label>
              Product name
              <input
                name="name"
                required
                maxLength={140}
                placeholder="e.g. Handwoven raffia tote"
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                required
                rows={3}
                placeholder="What makes this piece special?"
              />
            </label>
            <div className="admin-form-grid">
              <label>
                Price (₦)
                <input
                  name="price"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                />
              </label>
              <label>
                Compare-at price (₦)
                <input
                  name="compareAtPrice"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </label>
              <label>
                Stock quantity
                <input name="stock" type="number" min="0" step="1" required />
              </label>
              <label>
                SKU
                <input name="sku" required placeholder="e.g. NAI-TOTE-001" />
              </label>
              <label>
                City (optional)
                <input name="originCity" placeholder="Abeokuta" />
              </label>
              <label>
                State
                <input name="originState" required placeholder="Lagos" />
              </label>
              <label>
                Category
                <select name="categoryId" required defaultValue="">
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories.map((category) => (
                    <option value={category.id} key={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Badge (optional)
              <input name="badge" maxLength={40} placeholder="Bestseller" />
            </label>
            <label>
              Product image URLs{" "}
              <span className="admin-field-help">
                Add one URL per line or paste a JSON array of URL strings.
              </span>
              <textarea
                name="images"
                rows={3}
                placeholder="https://example.com/product-image.jpg"
                required
              />
            </label>
            <label>
              Product details{" "}
              <span className="admin-field-help">One detail per line.</span>
              <textarea
                name="details"
                rows={4}
                placeholder={"Hand-dyed Adire cotton\nRelaxed, breathable fit"}
              />
            </label>
            <label>
              Options{" "}
              <span className="admin-field-help">
                One option per line, formatted as Label: value, value.
              </span>
              <textarea
                name="options"
                rows={3}
                placeholder={"Size: S, M, L, XL\nColour: Indigo, Rust"}
              />
            </label>
            <p className="admin-inline-help">
              Your approved vendor business name is shown as the maker. Ratings
              and reviews are earned from customer feedback.
            </p>
            <label className="admin-checkbox">
              <input type="checkbox" name="isFlashSale" /> Feature this product
              in the flash sale
            </label>
            {categories.length === 0 && (
              <div className="admin-inline-help">
                Create a category before adding products.
                  {!isVendor && (
                    <button
                      type="button"
                      onClick={() => setCategoryModal(true)}
                    >
                      Create category
                    </button>
                  )}
              </div>
            )}
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setProductModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-primary-button"
                disabled={submitting || categories.length === 0}
              >
                {submitting ? "Saving…" : "Save product"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {categoryModal && !isVendor && (
        <Modal
          title="Create a category"
          onClose={() => setCategoryModal(false)}
        >
          <form className="admin-form" onSubmit={createCategory}>
            <label>
              Category name
              <input
                name="categoryName"
                required
                placeholder="e.g. Textiles & fashion"
              />
            </label>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setCategoryModal(false)}
              >
                Cancel
              </button>
              <button className="admin-primary-button" disabled={submitting}>
                {submitting ? "Saving…" : "Create category"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function ProductsScreen({
  loading,
  products,
  allProducts,
  search,
  onSearch,
  onAdd,
  onToggleFlashSale,
  onRefresh,
  canManageProducts,
}: {
  loading: boolean;
  products: AdminProduct[];
  allProducts: AdminProduct[];
  search: string;
  onSearch: (value: string) => void;
  onAdd: () => void;
  onToggleFlashSale: (product: AdminProduct, enabled: boolean) => void;
  onRefresh: () => void;
  canManageProducts: boolean;
}) {
  const inventoryValue = allProducts.reduce(
    (total, product) => total + Number(product.price) * product.stock,
    0,
  );
  const lowStock = allProducts.filter(
    (product) => product.stock > 0 && product.stock <= 5,
  ).length;
  return (
    <>
      <div className="admin-metrics">
        <MetricCard
          label="ALL PRODUCTS"
          value={String(allProducts.length)}
          note="Products in this catalogue"
        />
        <MetricCard
          label="INVENTORY VALUE"
          value={money(inventoryValue)}
          note="Based on current stock"
          tone="orange"
        />
        <MetricCard
          label="LOW STOCK"
          value={String(lowStock)}
          note="Products with 5 or fewer items"
          tone={lowStock ? "orange" : "green"}
        />
      </div>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>{canManageProducts ? "Your product catalogue" : "Marketplace catalogue"}</h2>
            <p>
              {canManageProducts
                ? "Product availability updates are reflected in the storefront."
                : "Monitor products across the marketplace and see each vendor owner."}
            </p>
          </div>
          <div className="admin-panel-actions">
            <label className="admin-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="Search products…"
              />
            </label>
            <button
              className="admin-secondary-button"
              type="button"
              onClick={onRefresh}
            >
              ↻ Refresh
            </button>
            {canManageProducts && <button
              className="admin-primary-button mobile-add"
              type="button"
              onClick={onAdd}
            >
              ＋ Add product
            </button>}
          </div>
        </div>
        {loading ? (
          <LoadingLine />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            detail={canManageProducts
              ? "Add your first product or adjust your search."
              : "No marketplace products match this search."}
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>SKU</th>
                  <th>CATEGORY</th>
                  <th>PRICE</th>
                  <th>IN STOCK</th>
                  {canManageProducts && <th>FLASH SALE</th>}
                  <th>ADDED</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product-cell">
                        <span
                          className="admin-product-thumb"
                          style={
                            product.images[0]
                              ? {
                                  backgroundImage: `url("${product.images[0]}")`,
                                }
                              : undefined
                          }
                        >
                          {!product.images[0] && "✳"}
                        </span>
                        <span>
                          <strong>{product.name}</strong>
                          <small>
                            {product.originCity
                              ? `${product.originCity}, ${product.originState}`
                              : product.originState}
                            {product.vendor
                              ? ` · ${product.vendor.vendorProfile?.businessName ?? `${product.vendor.firstName} ${product.vendor.lastName}`}`
                              : " · Marketplace"}
                          </small>
                        </span>
                      </div>
                    </td>
                    <td className="admin-mono">{product.sku}</td>
                    <td>{product.category?.name ?? "Uncategorized"}</td>
                    <td className="admin-price">{money(product.price)}</td>
                    <td>
                      <span
                        className={`stock-pill${product.stock <= 5 ? " low" : ""}`}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    {canManageProducts && <td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={product.isFlashSale}
                        className={`admin-switch${product.isFlashSale ? " on" : ""}`}
                        onClick={() =>
                          onToggleFlashSale(product, !product.isFlashSale)
                        }
                      >
                        <span />
                      </button>
                    </td>}
                    <td>{date(product.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="admin-table-foot">
          <span>
            Showing {products.length} of {allProducts.length} products
          </span>
          <span>All changes sync to the storefront</span>
        </div>
      </section>
    </>
  );
}

function MarketingScreen({
  loading,
  products,
  onToggleFlashSale,
  onAdd,
  canManageProducts,
}: {
  loading: boolean;
  products: AdminProduct[];
  onToggleFlashSale: (product: AdminProduct, enabled: boolean) => void;
  onAdd: () => void;
  canManageProducts: boolean;
}) {
  const flashProducts = products.filter((product) => product.isFlashSale);
  return (
    <>
      <section className="marketing-banner">
        <div className="marketing-banner-text">
          <span className="admin-kicker">THE SPOTLIGHT IS YOURS</span>
          <h2>
            {canManageProducts ? (
              <>A little more love<br />for your best sellers.</>
            ) : (
              <>Marketplace<br />product spotlight.</>
            )}
          </h2>
          <p>
            {canManageProducts
              ? "Put selected products in the flash sale and they’ll be highlighted for shoppers across the marketplace."
              : "Monitor featured products and their visibility across the marketplace."}
          </p>
          {canManageProducts && <button
            type="button"
            className="marketing-banner-button"
            onClick={onAdd}
          >
            Add a product <span>→</span>
          </button>}
        </div>
        <div className="marketing-banner-art">
          <span>✳</span>
          <i>
            made
            <br />
            with care
          </i>
        </div>
        <div className="marketing-banner-note">
          GOOD THINGS DESERVE TO BE FOUND
        </div>
      </section>
      <div className="admin-metrics">
        <MetricCard
          label="FEATURED PRODUCTS"
          value={String(flashProducts.length)}
          note="Currently in flash sale"
          tone="orange"
        />
        <MetricCard
          label="AVAILABLE TO FEATURE"
          value={String(products.length - flashProducts.length)}
          note="Products not in the sale"
        />
        <MetricCard
          label="CAMPAIGN STATUS"
          value={flashProducts.length ? "LIVE" : "READY"}
          note="Synced with storefront"
          tone="green"
        />
      </div>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Flash sale selection</h2>
            <p>Choose the products that receive a little extra attention.</p>
          </div>
          <span className="admin-count-chip">
            {flashProducts.length} featured
          </span>
        </div>
        {loading ? (
          <LoadingLine />
        ) : products.length === 0 ? (
          <EmptyState
            title="Your spotlight is waiting"
            detail={canManageProducts
              ? "Add products to your catalogue, then feature them here."
              : "Products and their marketplace visibility are shown here."}
          />
        ) : (
          <div className="marketing-product-list">
            {products.map((product) => (
              <div className="marketing-product-row" key={product.id}>
                <span
                  className="admin-product-thumb"
                  style={
                    product.images[0]
                      ? { backgroundImage: `url("${product.images[0]}")` }
                      : undefined
                  }
                >
                  {!product.images[0] && "✳"}
                </span>
                <span className="marketing-product-info">
                  <strong>{product.name}</strong>
                  <small>
                    {product.category?.name ?? "Uncategorized"} ·{" "}
                    {product.stock} in stock
                  </small>
                </span>
                <strong className="admin-price">{money(product.price)}</strong>
                <span
                  className={`campaign-status${product.isFlashSale ? " live" : ""}`}
                >
                  {product.isFlashSale ? "Featured" : "Not featured"}
                </span>
                {canManageProducts && <button
                  type="button"
                  role="switch"
                  aria-checked={product.isFlashSale}
                  className={`admin-switch${product.isFlashSale ? " on" : ""}`}
                  onClick={() =>
                    onToggleFlashSale(product, !product.isFlashSale)
                  }
                >
                  <span />
                </button>}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function OrdersScreen({
  loading,
  orders,
  allOrders,
  search,
  onSearch,
  onStatusChange,
  onItemStatusChange,
  vendorView,
}: {
  loading: boolean;
  orders: AdminOrder[];
  allOrders: AdminOrder[];
  search: string;
  onSearch: (value: string) => void;
  onStatusChange: (id: string, status: AdminOrder["status"]) => void;
  onItemStatusChange: (
    orderId: string,
    itemId: string,
    status: AdminOrder["status"],
  ) => void;
  vendorView: boolean;
}) {
  const pendingCount = allOrders.filter(
    (order) => order.status === "PENDING",
  ).length;
  const processingCount = allOrders.filter(
    (order) => order.status === "PROCESSING",
  ).length;
  const deliveredCount = allOrders.filter(
    (order) => order.status === "DELIVERED",
  ).length;
  return (
    <>
      <div className="admin-metrics">
        <MetricCard
          label="TOTAL ORDERS"
          value={String(allOrders.length)}
          note="All time"
        />
        <MetricCard
          label="NEEDS ATTENTION"
          value={String(pendingCount)}
          note="Awaiting confirmation"
          tone={pendingCount ? "orange" : "green"}
        />
        <MetricCard
          label="IN FULFILMENT"
          value={String(processingCount)}
          note="Being prepared or shipped"
        />
        <MetricCard
          label="DELIVERED"
          value={String(deliveredCount)}
          note="Successfully completed"
          tone="green"
        />
      </div>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Order queue</h2>
            <p>Track customer purchases and update fulfilment status.</p>
          </div>
          <label className="admin-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search orders…"
            />
          </label>
        </div>
        {loading ? (
          <LoadingLine />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders to show"
            detail="Orders will appear here as soon as customers start shopping."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>ITEMS</th>
                  {!vendorView && <th>VENDOR</th>}
                  <th>DESTINATION</th>
                  <th>TOTAL</th>
                  <th>PAYMENT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong className="admin-order-number">
                        {order.orderNumber}
                      </strong>
                      <small className="admin-cell-sub">
                        {date(order.createdAt)}
                      </small>
                    </td>
                    <td>
                      <strong>
                        {order.user
                          ? `${order.user.firstName} ${order.user.lastName}`
                          : "Customer"}
                      </strong>
                      <small className="admin-cell-sub">
                        {order.user?.email ?? ""}
                      </small>
                      {order.user?.phone && (
                        <small className="admin-cell-sub">{order.user.phone}</small>
                      )}
                    </td>
                    <td>
                      <strong>
                        {order.items.reduce((count, item) => count + item.quantity, 0)} items
                      </strong>
                      {order.items.map((item) => (
                        <small className="admin-cell-sub" key={item.id}>
                          {item.product.name} × {item.quantity} · {item.status.toLowerCase()}
                        </small>
                      ))}
                    </td>
                    {!vendorView && <td>
                      {Array.from(
                        new Set(
                          order.items.map(
                            (item) =>
                              item.product.vendor?.vendorProfile?.businessName ??
                              (item.product.vendor
                                ? `${item.product.vendor.firstName} ${item.product.vendor.lastName}`
                                : "Marketplace"),
                          ),
                        ),
                      ).join(", ")}
                    </td>}
                    <td>
                      {order.shippingAddress
                        ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}`
                        : "—"}
                      {order.shippingAddress && (
                        <small className="admin-cell-sub">
                          {order.shippingAddress.fullName} · {order.shippingAddress.phone}
                        </small>
                      )}
                    </td>
                    <td className="admin-price">{money(order.totalAmount)}</td>
                    <td>
                      <span
                        className={`payment-status${order.transaction?.status === "SUCCESS" ? " paid" : ""}`}
                      >
                        {order.transaction?.status ?? "PENDING"}
                      </span>
                    </td>
                    <td>
                      {vendorView ? (
                        order.items.map((item) => {
                          const nextStatus: AdminOrder["status"] | undefined =
                            item.status === "PENDING"
                              ? "PROCESSING"
                              : item.status === "PROCESSING"
                                ? "SHIPPED"
                                : item.status === "SHIPPED"
                                  ? "DELIVERED"
                                  : undefined;
                          return (
                            <label className="admin-order-item-status" key={item.id}>
                              <span>{item.product.name}</span>
                              <select
                                className={`order-status-select status-${item.status.toLowerCase()}`}
                                value={item.status}
                                disabled={!nextStatus || order.transaction?.status !== "SUCCESS"}
                                onChange={(event) =>
                                  onItemStatusChange(
                                    order.id,
                                    item.id,
                                    event.target.value as AdminOrder["status"],
                                  )
                                }
                                aria-label={`Update ${item.product.name} fulfillment status`}
                              >
                                <option value={item.status}>{item.status.toLowerCase()}</option>
                                {nextStatus && (
                                  <option value={nextStatus}>{nextStatus.toLowerCase()}</option>
                                )}
                              </select>
                            </label>
                          );
                        })
                      ) : (
                        <select
                          className={`order-status-select status-${order.status.toLowerCase()}`}
                          value={order.status}
                          onChange={(event) =>
                            onStatusChange(
                              order.id,
                              event.target.value as AdminOrder["status"],
                            )
                          }
                          aria-label={`Change status for ${order.orderNumber}`}
                        >
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status.toLowerCase()}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="admin-table-foot">
          <span>
            Showing {orders.length} of {allOrders.length} orders
          </span>
          <span>Status changes are saved to the backend</span>
        </div>
      </section>
    </>
  );
}

function VendorApplicationsScreen({
  loading,
  applications,
  allApplications,
  search,
  onSearch,
  onReview,
  submitting,
}: {
  loading: boolean;
  applications: AdminVendorApplication[];
  allApplications: AdminVendorApplication[];
  search: string;
  onSearch: (value: string) => void;
  onReview: (userId: string, status: "APPROVED" | "REJECTED") => void;
  submitting: boolean;
}) {
  const pendingCount = allApplications.filter(
    (application) => application.verificationStatus === "PENDING",
  ).length;
  const approvedCount = allApplications.filter(
    (application) => application.verificationStatus === "APPROVED",
  ).length;

  return (
    <>
      <div className="admin-metrics">
        <MetricCard
          label="APPLICATIONS"
          value={String(allApplications.length)}
          note="All submitted profiles"
        />
        <MetricCard
          label="PENDING REVIEW"
          value={String(pendingCount)}
          note="Awaiting a decision"
          tone="orange"
        />
        <MetricCard
          label="APPROVED SELLERS"
          value={String(approvedCount)}
          note="Verified businesses"
          tone="green"
        />
        <MetricCard
          label="CHANGES REQUESTED"
          value={String(allApplications.length - pendingCount - approvedCount)}
          note="Can be resubmitted"
        />
      </div>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Seller verification queue</h2>
            <p>
              Review submitted business information before approving sellers.
            </p>
          </div>
          <label className="admin-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search businesses…"
            />
          </label>
        </div>
        {loading ? (
          <LoadingLine />
        ) : applications.length === 0 ? (
          <EmptyState
            title="No applications found"
            detail="Seller profiles will appear here when they are submitted."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table vendor-applications-table">
              <thead>
                <tr>
                  <th>APPLICANT</th>
                  <th>BUSINESS</th>
                  <th>TYPE</th>
                  <th>LOCATION</th>
                  <th>REGISTRATION</th>
                  <th>STATUS</th>
                  <th>REVIEW</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <strong>
                        {application.user.firstName} {application.user.lastName}
                      </strong>
                      <small>{application.user.email}</small>
                      <small>
                        {application.user.phone ?? "No phone provided"}
                      </small>
                    </td>
                    <td>
                      <strong>{application.businessName}</strong>
                      <small>{application.description}</small>
                    </td>
                    <td>
                      {application.businessType === "ARTISAN"
                        ? "Artisan / maker"
                        : "Vendor / retailer"}
                    </td>
                    <td>
                      {application.addressLine}
                      <small>
                        {application.city}, {application.state}
                      </small>
                    </td>
                    <td>{application.registrationNumber ?? "Not provided"}</td>
                    <td>
                      <span
                        className={`vendor-status-pill ${application.verificationStatus.toLowerCase()}`}
                      >
                        {application.verificationStatus.toLowerCase()}
                      </span>
                    </td>
                    <td>
                      {application.verificationStatus === "PENDING" ? (
                        <div className="vendor-review-actions">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() =>
                              onReview(application.user.id, "APPROVED")
                            }
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() =>
                              onReview(application.user.id, "REJECTED")
                            }
                          >
                            Request changes
                          </button>
                        </div>
                      ) : (
                        <span className="admin-cell-sub">
                          Reviewed{" "}
                          {date(
                            application.reviewedAt ?? application.submittedAt,
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="admin-table-foot">
          <span>
            Showing {applications.length} of {allApplications.length}{" "}
            applications
          </span>
          <span>Review decisions update seller access immediately</span>
        </div>
      </section>
    </>
  );
}

function CustomersScreen({
  loading,
  users,
  allUsers,
  search,
  onSearch,
  vendorView,
}: {
  loading: boolean;
  users: AdminDirectoryUser[];
  allUsers: AdminDirectoryUser[];
  search: string;
  onSearch: (value: string) => void;
  vendorView: boolean;
}) {
  const customerCount = allUsers.filter(
    (user) => user.role === "CUSTOMER",
  ).length;
  const orderCount = allUsers.reduce(
    (total, user) => total + user._count.orders,
    0,
  );
  const makerCount = allUsers.filter((user) => user.role === "VENDOR").length;
  const verifiedCount = allUsers.filter((user) => user.isVerified).length;
  return (
    <>
      <div className="admin-metrics">
        <MetricCard
          label={vendorView ? "MY CUSTOMERS" : "COMMUNITY MEMBERS"}
          value={String(allUsers.length)}
          note={vendorView ? "Customers who purchased from you" : "Registered accounts"}
        />
        <MetricCard
          label={vendorView ? "ORDERS FROM CUSTOMERS" : "CUSTOMERS"}
          value={String(vendorView ? orderCount : customerCount)}
          note={vendorView ? "Orders containing your products" : "Ready to discover"}
          tone="orange"
        />
        {!vendorView && (
          <>
            <MetricCard
              label="MAKERS & VENDORS"
              value={String(makerCount)}
              note="Independent sellers"
            />
            <MetricCard
              label="VERIFIED ACCOUNTS"
              value={String(verifiedCount)}
              note="Email confirmed"
              tone="green"
            />
          </>
        )}
      </div>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>{vendorView ? "Customers who purchased from you" : "Our community"}</h2>
            <p>
              {vendorView
                ? "Customer contact details and order counts for your products."
                : "Customer and maker accounts registered on Neomart."}
            </p>
          </div>
          <label className="admin-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search people…"
            />
          </label>
        </div>
        {loading ? (
          <LoadingLine />
        ) : users.length === 0 ? (
          <EmptyState
            title="No community members found"
            detail="Try a different search or check back later."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>MEMBER</th>
                  {!vendorView && <th>ROLE</th>}
                  <th>PHONE</th>
                  <th>ORDERS</th>
                  {!vendorView && <th>PRODUCTS</th>}
                  {!vendorView && <th>VERIFIED</th>}
                  <th>JOINED</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-product-cell">
                        <span className="admin-avatar user">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </span>
                        <span>
                          <strong>
                            {user.firstName} {user.lastName}
                          </strong>
                          <small>{user.email}</small>
                        </span>
                      </div>
                    </td>
                    {!vendorView && (
                      <td>
                        <span
                          className={`role-pill role-${user.role.toLowerCase()}`}
                        >
                          {user.role === "VENDOR"
                            ? "Maker"
                            : user.role.toLowerCase()}
                        </span>
                      </td>
                    )}
                    <td>{user.phone ?? "—"}</td>
                    <td>{user._count.orders}</td>
                    {!vendorView && <td>{user._count.products}</td>}
                    {!vendorView && (
                      <td>
                        <span
                          className={`verify-pill${user.isVerified ? " verified" : ""}`}
                        >
                          {user.isVerified ? "Verified" : "Pending"}
                        </span>
                      </td>
                    )}
                    <td>{date(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="admin-table-foot">
          <span>
            Showing {users.length} of {allUsers.length} members
          </span>
          <span>
            {vendorView
              ? "Only customers who ordered your products are shown"
              : "Personal details are restricted to administrator access"}
          </span>
        </div>
      </section>
    </>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="admin-empty">
      <span>✳</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function parseProductImages(value: string): string[] {
  const trimmedValue = value.trim();
  const images: unknown = trimmedValue.startsWith("[")
    ? JSON.parse(trimmedValue)
    : trimmedValue.split(/\r?\n/);

  if (!Array.isArray(images) || !images.every((image) => typeof image === "string")) {
    throw new Error("Enter image URLs one per line or as a JSON array of strings.");
  }

  return images
    .map((image) => image.trim().replace(/^["']+|["']+$/g, ""))
    .filter(Boolean);
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="admin-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
      >
        <div className="admin-modal-heading">
          <div>
            <span className="admin-kicker">CATALOGUE SETUP</span>
            <h2 id="admin-modal-title">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
