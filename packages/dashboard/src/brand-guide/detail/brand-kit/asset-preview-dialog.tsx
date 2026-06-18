import type React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { AssetPreview } from "./asset-preview";
import type { AssetShowcase } from "./asset-showcase";

export const AssetPreviewDialog = ({
  asset,
  children,
  previewUrl,
}: Readonly<{ asset: AssetShowcase; children: React.ReactNode; previewUrl: string }>) => (
  <Dialog>
    <DialogTrigger asChild>{children}</DialogTrigger>
    <DialogContent
      className="h-[540px] max-h-[calc(100vh-2rem)] w-[820px] max-w-[calc(100vw-2rem)] border-0 p-0"
      showCloseButton={false}
    >
      <div className="grid h-full md:grid-cols-[minmax(0,1.22fr)_minmax(0,0.78fr)]">
        <div className="min-h-0 overflow-hidden bg-onbrand-charcoal/5">
          <AssetPreview
            alt={asset.description}
            className="h-full w-full object-cover"
            src={previewUrl}
          />
        </div>
        <div className="flex min-w-0 flex-col justify-between px-4 py-8 pr-8 md:px-8 md:py-10 md:pr-10">
          <div>
            <DialogTitle className="m-0 max-w-sm text-3xl leading-none font-medium tracking-[-0.055em] text-onbrand-charcoal">
              {asset.name}
            </DialogTitle>
            <DialogDescription className="mt-4 max-w-sm text-sm leading-6 text-onbrand-charcoal/62">
              {asset.description}
            </DialogDescription>
          </div>
          <div />
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
