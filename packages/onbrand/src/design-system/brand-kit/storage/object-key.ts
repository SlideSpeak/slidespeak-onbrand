export const brandKitAssetFileObjectKey = (input: {
  ownerUserId: string;
  designSystemId: string;
  assetId: string;
  filename: string;
}): string =>
  [
    encodePathSegment(input.ownerUserId),
    encodePathSegment(input.designSystemId),
    encodePathSegment(input.assetId),
    encodePathSegment(input.filename),
  ].join("/");

const encodePathSegment = (value: string): string =>
  encodeURIComponent(value).replaceAll("%2F", "%252F");
