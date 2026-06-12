import { encodeRfc5987 } from "@onbrand/string";

export const contentDisposition = (filename: string): string =>
  `attachment; filename="${filename.replaceAll(/["\\]/g, "_")}"; filename*=UTF-8''${encodeRfc5987(filename)}`;
