import React from "react";

export type ApiState<T> =
  | Readonly<{ status: "LOADING" }>
  | Readonly<{ status: "ERROR"; message: string }>
  | Readonly<{ status: "READY"; data: T }>;

export type OptionalApiState<T> = ApiState<T> | Readonly<{ status: "UNAUTHENTICATED" }>;

type OptionalApiResponse<T> =
  | Readonly<{ status: "UNAUTHENTICATED" }>
  | Readonly<{ status: "READY"; data: T }>;

const AUTH_RECOVERY_DELAYS_MS = [75, 200] as const;

const fetchJson = async <T>(path: string): Promise<T> => {
  const request = () => fetch(path, { credentials: "include" });
  const response = await recoverUnauthorizedResponse(await request(), request);
  if (response.status === 401) {
    redirectToLogin();
    return new Promise<T>(() => undefined);
  }
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as T;
};

const fetchOptionalJson = async <T>(path: string): Promise<OptionalApiResponse<T>> => {
  const request = () => fetch(path, { credentials: "include" });
  const response = await recoverUnauthorizedResponse(await request(), request);
  if (response.status === 401) return { status: "UNAUTHENTICATED" };
  if (!response.ok) throw new Error(await response.text());
  return { status: "READY", data: (await response.json()) as T };
};

export const sendJson = async <T>(
  path: string,
  options: Readonly<{ method: string; body?: unknown }>,
): Promise<T> => {
  const request = () =>
    fetch(path, {
      credentials: "include",
      method: options.method,
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  const response = await recoverUnauthorizedResponse(await request(), request);
  if (response.status === 401) {
    redirectToLogin();
    return new Promise<T>(() => undefined);
  }
  if (!response.ok) throw new Error(await response.text());
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

const recoverUnauthorizedResponse = async (
  response: Response,
  retryRequest: () => Promise<Response>,
): Promise<Response> => {
  if (response.status !== 401) return response;
  if (!(await waitForDashboardSessionRecovery())) return response;
  return retryRequest();
};

const waitForDashboardSessionRecovery = async (): Promise<boolean> => {
  for (const delayMs of AUTH_RECOVERY_DELAYS_MS) {
    await delay(delayMs);
    const response = await fetch("/api/me", {
      credentials: "include",
    });
    if (response.ok) return true;
    if (response.status !== 401) return false;
  }
  return false;
};

const redirectToLogin = (): void => {
  window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

type ApiStateForPath<T> = ApiState<T> & Readonly<{ path: string }>;
type OptionalApiStateForPath<T> = OptionalApiState<T> & Readonly<{ path: string }>;

export const useApi = <T>(path: string): ApiState<T> => {
  const [state, setState] = React.useState<ApiStateForPath<T>>({ path, status: "LOADING" });

  React.useEffect(() => {
    let cancelled = false;
    fetchJson<T>(path)
      .then((data) => {
        if (!cancelled) setState({ path, status: "READY", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            path,
            status: "ERROR",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (state.path !== path) return { status: "LOADING" };
  return state;
};

export const useOptionalApi = <T>(path: string): OptionalApiState<T> => {
  const [state, setState] = React.useState<OptionalApiStateForPath<T>>({
    path,
    status: "LOADING",
  });

  React.useEffect(() => {
    let cancelled = false;
    fetchOptionalJson<T>(path)
      .then((response) => {
        if (cancelled) return;
        setState(
          response.status === "UNAUTHENTICATED"
            ? { path, status: "UNAUTHENTICATED" }
            : { path, status: "READY", data: response.data },
        );
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            path,
            status: "ERROR",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (state.path !== path) return { status: "LOADING" };
  return state;
};
