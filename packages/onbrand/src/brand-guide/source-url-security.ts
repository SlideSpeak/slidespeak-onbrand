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
  const hostname = normalizedUrlHostname(url.hostname);
  if (!isPublicHostnameSyntax(hostname)) throw new UnsafeOutboundUrlError(url.toString());

  const hostnameIpVersion = isIP(hostname);
  if (hostnameIpVersion !== 0) {
    if (!isPublicIpAddress(hostname, hostnameIpVersion)) {
      throw new UnsafeOutboundUrlError(url.toString());
    }
    return;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0) throw new UnsafeOutboundUrlError(url.toString());
  if (!addresses.every((address) => isPublicIpAddress(address.address, address.family))) {
    throw new UnsafeOutboundUrlError(url.toString());
  }
};

export class UnsafeOutboundUrlError extends Error {
  constructor(url: string) {
    super(`Outbound URL is not public: ${url}`);
    this.name = "UnsafeOutboundUrlError";
  }
}

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
