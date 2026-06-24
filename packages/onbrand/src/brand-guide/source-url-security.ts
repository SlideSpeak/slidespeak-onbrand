import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

export const OUTBOUND_REQUEST_TIMEOUT_MS = 10_000;

const PRIVATE_IPV4_RANGES = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const;

export const normalizePublicHttpUrl = (value: string): URL | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//iu.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!isPublicHostnameSyntax(url.hostname)) return null;
    url.username = "";
    url.password = "";
    url.hash = "";
    return url;
  } catch {
    return null;
  }
};

export const assertPublicOutboundUrl = async (url: URL): Promise<void> => {
  await resolvePublicOutboundAddress(url);
};

export const fetchPublicOutboundUrl = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  redirects = 0,
): Promise<Response> => {
  const request = new Request(input, init);
  if (redirects > 5) throw new Error(`Too many redirects while fetching ${request.url}`);
  const url = normalizePublicHttpUrl(request.url);
  if (!url) throw new UnsafeOutboundUrlError(request.url);
  const resolved = await resolvePublicOutboundAddress(url);
  const response = await fetchResolvedAddress(url, resolved, request);

  if (response.status >= 300 && response.status < 400) {
    if (request.redirect === "manual") return response;
    if (request.redirect === "error") throw new Error(`Redirect blocked for ${url.toString()}`);
    const location = response.headers.get("location");
    if (!location) return response;
    return fetchPublicOutboundUrl(new URL(location, url), init, redirects + 1);
  }

  return response;
};

export const withPublicOutboundFetch = async <T>(operation: () => Promise<T>): Promise<T> => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchPublicOutboundUrl;
  try {
    return await operation();
  } finally {
    globalThis.fetch = originalFetch;
  }
};

export class UnsafeOutboundUrlError extends Error {
  constructor(url: string) {
    super(`Outbound URL is not public: ${url}`);
    this.name = "UnsafeOutboundUrlError";
  }
}

const resolvePublicOutboundAddress = async (
  url: URL,
): Promise<Readonly<{ address: string; family: 4 | 6 }>> => {
  const hostname = normalizedUrlHostname(url.hostname);
  if (!isPublicHostnameSyntax(hostname)) throw new UnsafeOutboundUrlError(url.toString());

  const hostnameIpVersion = isIP(hostname);
  if (hostnameIpVersion !== 0) {
    if (!isPublicIpAddress(hostname, hostnameIpVersion)) {
      throw new UnsafeOutboundUrlError(url.toString());
    }
    return { address: hostname, family: hostnameIpVersion === 4 ? 4 : 6 };
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0) throw new UnsafeOutboundUrlError(url.toString());
  if (!addresses.every((address) => isPublicIpAddress(address.address, address.family))) {
    throw new UnsafeOutboundUrlError(url.toString());
  }
  const [address] = addresses;
  if (!address || (address.family !== 4 && address.family !== 6)) {
    throw new UnsafeOutboundUrlError(url.toString());
  }
  return { address: address.address, family: address.family };
};

const isPublicHostnameSyntax = (hostname: string): boolean => {
  const normalized = normalizedUrlHostname(hostname).toLowerCase();
  if (!normalized.includes(".") && isIP(normalized) === 0) return false;
  if (normalized === "localhost" || normalized.endsWith(".localhost")) return false;
  return true;
};

const isPublicIpAddress = (address: string, family: number): boolean => {
  if (family === 4) return isPublicIpv4Address(address);
  if (family === 6) return isPublicIpv6Address(address);
  return false;
};

const isPublicIpv4Address = (address: string): boolean => {
  const numeric = ipv4ToNumber(address);
  if (numeric === null) return false;
  return !PRIVATE_IPV4_RANGES.some(([range, bits]) => {
    const rangeNumeric = ipv4ToNumber(range);
    if (rangeNumeric === null) return true;
    const mask = (0xffffffff << (32 - bits)) >>> 0;
    return (numeric & mask) === (rangeNumeric & mask);
  });
};

const ipv4ToNumber = (address: string): number | null => {
  const octets = address.split(".");
  if (octets.length !== 4) return null;
  let numeric = 0;
  for (const octet of octets) {
    if (!/^\d{1,3}$/u.test(octet)) return null;
    const value = Number(octet);
    if (value < 0 || value > 255) return null;
    numeric = (numeric << 8) + value;
  }
  return numeric >>> 0;
};

const isPublicIpv6Address = (address: string): boolean => {
  const normalized = address.toLowerCase();
  const embeddedIpv4 = embeddedIpv4FromIpv6(normalized);
  if (embeddedIpv4) return isPublicIpv4Address(embeddedIpv4);
  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  )
    return false;
  return true;
};

const embeddedIpv4FromIpv6 = (address: string): string | null => {
  const normalized = normalizedUrlHostname(address).toLowerCase();
  const prefix = normalized.startsWith("::ffff:")
    ? "::ffff:"
    : normalized.startsWith("::")
      ? "::"
      : null;
  if (!prefix) return null;
  const embedded = normalized.slice(prefix.length);
  if (embedded.includes(".")) return embedded;
  const hextets = embedded.split(":");
  if (hextets.length !== 2) return null;
  const [high, low] = hextets.map((hextet) => Number.parseInt(hextet, 16));
  if (
    high === undefined ||
    low === undefined ||
    !Number.isInteger(high) ||
    !Number.isInteger(low) ||
    high < 0 ||
    high > 0xffff ||
    low < 0 ||
    low > 0xffff
  )
    return null;
  return `${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`;
};

const normalizedUrlHostname = (hostname: string): string =>
  hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;

const fetchResolvedAddress = async (
  url: URL,
  resolved: Readonly<{ address: string; family: 4 | 6 }>,
  request: Request,
): Promise<Response> =>
  new Promise((resolve, reject) => {
    const headers = new Headers(request.headers);
    headers.set("Host", url.host);
    const clientRequest = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      {
        protocol: url.protocol,
        host: resolved.address,
        port: url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80,
        family: resolved.family,
        method: request.method,
        path: `${url.pathname}${url.search}`,
        servername: normalizedUrlHostname(url.hostname),
        headers: Object.fromEntries(headers.entries()),
        signal: request.signal,
      },
      (message) => {
        const chunks: Buffer[] = [];
        message.on("data", (chunk: Buffer | string) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
        );
        message.on("end", () => {
          resolve(
            new Response(Buffer.concat(chunks), {
              status: message.statusCode ?? 500,
              statusText: message.statusMessage,
              headers: responseHeaders(message.headers),
            }),
          );
        });
      },
    );
    clientRequest.on("error", reject);
    if (request.body) {
      reject(new Error("Outbound fetch request bodies are not supported"));
      clientRequest.destroy();
      return;
    }
    clientRequest.end();
  });

const responseHeaders = (headers: Record<string, string | string[] | undefined>): Headers => {
  const result = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) result.append(key, entry);
      continue;
    }
    result.set(key, value);
  }
  return result;
};
