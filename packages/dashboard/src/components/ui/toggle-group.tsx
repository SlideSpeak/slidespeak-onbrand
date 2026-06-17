import type React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const TOGGLE_GROUP_VARIANTS = cva(
  "inline-flex items-center justify-center rounded-sm text-xs transition-colors focus-visible:ring-2 focus-visible:ring-onbrand-blue-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-onbrand-blue-50 data-[state=on]:text-onbrand-blue-600 data-[state=on]:ring-1 data-[state=on]:ring-onbrand-blue-200 data-[state=on]:shadow-sm data-[state=off]:text-onbrand-charcoal data-[state=off]:hover:text-onbrand-blue-600",
  {
    variants: {
      size: {
        DEFAULT: "h-8 w-8 p-0",
        sm: "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      size: "DEFAULT",
    },
  },
);

export const ToggleGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) => (
  <ToggleGroupPrimitive.Root
    className={cn("inline-flex rounded-md border border-onbrand-charcoal/8 p-0.5", className)}
    {...props}
  />
);

export const ToggleGroupItem = ({
  className,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof TOGGLE_GROUP_VARIANTS>) => (
  <ToggleGroupPrimitive.Item
    className={cn(TOGGLE_GROUP_VARIANTS({ size }), className)}
    {...props}
  />
);
