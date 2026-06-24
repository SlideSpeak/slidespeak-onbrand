import { EventEmitter } from "node:events";
import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertPublicOutboundUrl,
  fetchPublicOutboundUrl,
  normalizePublicHttpUrl,
  withPublicOutboundFetch,
} from "./source-url-security";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

vi.mock("node:https", () => ({
  request: vi.fn(),
}));

vi.mock("node:http", () => ({
  request: vi.fn(),
}));

type RequestOptions = Readonly<{
  host: string;
  servername: string;
  headers: Record<string, string>;
}>;

describe("source URL security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes public HTTP URLs without credentials or fragments", () => {
    const url = normalizePublicHttpUrl("example.com/path#section");

    expect(url?.toString()).toBe("https://example.com/path");
  });

  it("rejects private literal IP addresses", async () => {
    const url = normalizePublicHttpUrl("http://10.0.0.1/logo.svg");

    expect(url).not.toBeNull();
    await expect(assertPublicOutboundUrl(url as URL)).rejects.toThrow("Outbound URL is not public");
  });

  it("rejects IPv4-compatible IPv6 literals that embed private addresses", async () => {
    const url = normalizePublicHttpUrl("http://[::192.168.1.1]/logo.svg");

    expect(url).not.toBeNull();
    await expect(assertPublicOutboundUrl(url as URL)).rejects.toThrow("Outbound URL is not public");
  });

  it("rejects hostnames that resolve to private addresses", async () => {
    const lookupMock = lookup as unknown as ReturnType<typeof vi.fn>;
    lookupMock.mockResolvedValueOnce([
      { address: "93.184.216.34", family: 4 },
      { address: "169.254.169.254", family: 4 },
    ]);

    await expect(
      assertPublicOutboundUrl(new URL("https://assets.example/logo.svg")),
    ).rejects.toThrow("Outbound URL is not public");
  });

  it("rejects DNS results with IPv4-compatible IPv6 private addresses", async () => {
    const lookupMock = lookup as unknown as ReturnType<typeof vi.fn>;
    lookupMock.mockResolvedValueOnce([{ address: "::192.168.1.1", family: 6 }]);

    await expect(
      assertPublicOutboundUrl(new URL("https://assets.example/logo.svg")),
    ).rejects.toThrow("Outbound URL is not public");
  });

  it("connects to the validated IP while preserving Host and SNI", async () => {
    const lookupMock = lookup as unknown as ReturnType<typeof vi.fn>;
    const requestMock = httpsRequest as unknown as ReturnType<typeof vi.fn>;
    lookupMock.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);
    requestMock.mockImplementationOnce(((
      _options: unknown,
      callback: (message: ResponseMessage) => void,
    ) => {
      const message = responseMessage(200, { "content-type": "image/svg+xml" }, "<svg />");
      callback(message);
      queueMicrotask(() => emitResponseBody(message));
      return requestHandle();
    }) as never);

    const response = await fetchPublicOutboundUrl("https://assets.example/logo.svg", {
      headers: { Accept: "image/svg+xml" },
    });

    expect(await response.text()).toBe("<svg />");
    const [[options]] = requestMock.mock.calls as [[RequestOptions, unknown]];
    expect(options).toMatchObject({
      host: "93.184.216.34",
      servername: "assets.example",
    });
    expect(options.headers).toMatchObject({
      accept: "image/svg+xml",
      host: "assets.example",
    });
  });

  it("validates redirect targets before opening the redirected connection", async () => {
    const lookupMock = lookup as unknown as ReturnType<typeof vi.fn>;
    const requestMock = httpsRequest as unknown as ReturnType<typeof vi.fn>;
    lookupMock
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValueOnce([{ address: "10.0.0.1", family: 4 }]);
    requestMock.mockImplementationOnce(((
      _options: unknown,
      callback: (message: ResponseMessage) => void,
    ) => {
      const message = responseMessage(302, { location: "https://private.example/logo.svg" }, "");
      callback(message);
      queueMicrotask(() => emitResponseBody(message));
      return requestHandle();
    }) as never);

    await expect(fetchPublicOutboundUrl("https://assets.example/logo.svg")).rejects.toThrow(
      "Outbound URL is not public",
    );

    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it("serializes global fetch patching across concurrent operations", async () => {
    const nativeFetch = globalThis.fetch;
    let releaseFirst: () => void = () => undefined;
    const first = withPublicOutboundFetch(
      () =>
        new Promise<string>((resolve) => {
          releaseFirst = () => resolve("first");
        }),
      10_000,
    );
    await Promise.resolve();

    let secondStarted = false;
    const second = withPublicOutboundFetch(async () => {
      secondStarted = true;
      expect(globalThis.fetch).not.toBe(nativeFetch);
      return "second";
    }, 10_000);
    await Promise.resolve();

    expect(secondStarted).toBe(false);
    expect(globalThis.fetch).not.toBe(nativeFetch);
    releaseFirst();
    await expect(first).resolves.toBe("first");
    await expect(second).resolves.toBe("second");
    expect(globalThis.fetch).toBe(nativeFetch);
  });

  it("aborts patched fetches and releases the queue when the operation times out", async () => {
    const lookupMock = lookup as unknown as ReturnType<typeof vi.fn>;
    const requestMock = httpsRequest as unknown as ReturnType<typeof vi.fn>;
    lookupMock.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);
    requestMock.mockImplementationOnce(() => requestHandle());
    const nativeFetch = globalThis.fetch;
    const first = withPublicOutboundFetch(() => fetch("https://slow.example/logo.svg"), 1);
    await Promise.resolve();

    const second = withPublicOutboundFetch(async () => "second", 10_000);

    await expect(first).rejects.toThrow("Outbound request timed out");
    await expect(second).resolves.toBe("second");
    expect(globalThis.fetch).toBe(nativeFetch);
  });
});

const responseMessage = (
  statusCode: number,
  headers: Record<string, string>,
  body: string,
): ResponseMessage => {
  const message = new EventEmitter() as ResponseMessage;
  message.statusCode = statusCode;
  message.statusMessage = "OK";
  message.headers = headers;
  message.body = body;
  return message;
};

type ResponseMessage = EventEmitter & {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string>;
  body: string;
};

const emitResponseBody = (message: ResponseMessage): void => {
  if (message.body) message.emit("data", Buffer.from(message.body));
  message.emit("end");
};

const requestHandle = (): EventEmitter & { end: () => void; destroy: () => void } => {
  const request = new EventEmitter() as EventEmitter & { end: () => void; destroy: () => void };
  request.end = () => undefined;
  request.destroy = () => undefined;
  return request;
};
