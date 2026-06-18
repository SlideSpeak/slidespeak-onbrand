import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DashboardSquare03Icon, ListViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { AssetLayout } from "./asset-layout";

const ASSET_LAYOUT_OPTIONS = [
  { icon: DashboardSquare03Icon, label: "Grid view", value: "MASONRY" },
  { icon: ListViewIcon, label: "List view", value: "LIST" },
] as const;

const isAssetLayout = (value: string): value is AssetLayout =>
  ASSET_LAYOUT_OPTIONS.some((assetLayoutOption) => assetLayoutOption.value === value);

export const AssetLayoutSwitch = ({
  assetLayout,
  onAssetLayoutChange,
}: Readonly<{
  assetLayout: AssetLayout;
  onAssetLayoutChange: (assetLayout: AssetLayout) => void;
}>) => (
  <TooltipProvider delayDuration={150}>
    <ToggleGroup
      onValueChange={(nextAssetLayout) => {
        if (isAssetLayout(nextAssetLayout)) onAssetLayoutChange(nextAssetLayout);
      }}
      type="single"
      value={assetLayout}
    >
      {ASSET_LAYOUT_OPTIONS.map((assetLayoutOption) => (
        <Tooltip key={assetLayoutOption.value}>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              aria-label={assetLayoutOption.label}
              className={
                assetLayoutOption.value === assetLayout
                  ? "bg-onbrand-blue-50 text-onbrand-blue-600 shadow-sm ring-1 ring-onbrand-blue-200"
                  : "text-onbrand-charcoal hover:text-onbrand-blue-600"
              }
              value={assetLayoutOption.value}
            >
              <HugeiconsIcon
                aria-hidden="true"
                className="h-[18px] w-[18px]"
                color="currentColor"
                icon={assetLayoutOption.icon}
                primaryColor="currentColor"
                secondaryColor="currentColor"
                strokeWidth={2}
              />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom">{assetLayoutOption.label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  </TooltipProvider>
);
