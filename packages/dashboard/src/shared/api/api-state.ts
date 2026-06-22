import React from "react";

export type ApiState<T> =
  | Readonly<{ status: "LOADING" }>
  | Readonly<{ status: "ERROR"; message: string }>
  | Readonly<{ status: "READY"; data: T }>;

export type OptionalApiState<T> = ApiState<T> | Readonly<{ status: "UNAUTHENTICATED" }>;

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path, { credentials: "include" });
  if (response.status === 401) {
    window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
    return new Promise<T>(() => undefined);
  }
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as T;
};

export const sendJson = async <T>(
  path: string,
  options: Readonly<{ method: string; body?: unknown }>,
): Promise<T> => {
  const response = await fetch(path, {
    credentials: "include",
    method: options.method,
    headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (response.status === 401) {
    window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
    return new Promise<T>(() => undefined);
  }
  if (!response.ok) throw new Error(await response.text());
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

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
    fetch(path, { credentials: "include" })
      .then(async (response) => {
        if (cancelled) return;
        if (response.status === 401) {
          setState({ path, status: "UNAUTHENTICATED" });
          return;
        }
        if (!response.ok) throw new Error(await response.text());
        setState({ path, status: "READY", data: (await response.json()) as T });
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
