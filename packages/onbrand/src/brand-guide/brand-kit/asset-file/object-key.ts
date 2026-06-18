export const brandKitAssetFileObjectKey = (input: {
  ownerUserId: string;
  brandGuideId: string;
  assetId: string;
  filename: string;
}): string =>
  [
    encodePathSegment(input.ownerUserId),
    encodePathSegment(input.brandGuideId),
    encodePathSegment(input.assetId),
    encodePathSegment(input.filename),
  ].join("/");

const encodePathSegment = (value: string): string =>
  encodeURIComponent(value).replaceAll("%2F", "%252F");
