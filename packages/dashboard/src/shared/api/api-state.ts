import React from "react";

export type ApiState<T> =
  | Readonly<{ status: "LOADING" }>
  | Readonly<{ status: "ERROR"; message: string }>
  | Readonly<{ status: "READY"; data: T }>;

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path, { credentials: "include" });
  if (response.status === 401) {
    window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
    return new Promise<T>(() => undefined);
  }
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as T;
};

export const useApi = <T>(path: string): ApiState<T> => {
  const [state, setState] = React.useState<ApiState<T>>({ status: "LOADING" });

  React.useEffect(() => {
    let cancelled = false;
    fetchJson<T>(path)
      .then((data) => {
        if (!cancelled) setState({ status: "READY", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "ERROR",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
};
