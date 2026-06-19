import { useMemo, useSyncExternalStore } from "react";

import type { BrandGuideSummary } from "@onbrand/core/brand-guide/application-service";
import type { ApiState } from "./api/api-state";

const listeners = new Set<() => void>();
const updatedBrandGuides = new Map<string, BrandGuideSummary>();
const deletedBrandGuideIds = new Set<string>();
let version = 0;

const notify = () => {
  version += 1;
  for (const listener of listeners) listener();
};

export const publishBrandGuideUpdated = (brandGuide: BrandGuideSummary) => {
  deletedBrandGuideIds.delete(brandGuide.id);
  updatedBrandGuides.set(brandGuide.id, brandGuide);
  notify();
};

export const publishBrandGuideDeleted = (brandGuideId: string) => {
  updatedBrandGuides.delete(brandGuideId);
  deletedBrandGuideIds.add(brandGuideId);
  notify();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const snapshot = () => version;

export const useSyncedBrandGuides = (
  loadedBrandGuides: ApiState<readonly BrandGuideSummary[]>,
): ApiState<readonly BrandGuideSummary[]> => {
  const syncVersion = useSyncExternalStore(subscribe, snapshot, snapshot);

  return useMemo(() => {
    syncVersion.toString();
    if (loadedBrandGuides.status !== "READY") return loadedBrandGuides;
    const seen = new Set<string>();
    const merged: BrandGuideSummary[] = [];
    for (const brandGuide of loadedBrandGuides.data) {
      if (deletedBrandGuideIds.has(brandGuide.id)) continue;
      seen.add(brandGuide.id);
      merged.push(updatedBrandGuides.get(brandGuide.id) ?? brandGuide);
    }
    for (const brandGuide of updatedBrandGuides.values()) {
      if (!seen.has(brandGuide.id) && !deletedBrandGuideIds.has(brandGuide.id))
        merged.push(brandGuide);
    }
    return { status: "READY", data: merged };
  }, [loadedBrandGuides, syncVersion]);
};
