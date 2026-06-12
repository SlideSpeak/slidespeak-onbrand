// RFC 5987 encoding for extended HTTP header parameters such as
// Content-Disposition filename*=UTF-8''...; see RFC 6266 §4.3:
// https://www.rfc-editor.org/rfc/rfc6266#section-4.3
export const encodeRfc5987 = (value: string): string =>
  encodeURIComponent(value).replaceAll("'", "%27").replaceAll("(", "%28").replaceAll(")", "%29");
