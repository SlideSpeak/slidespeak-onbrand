import type React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverPortal = PopoverPrimitive.Portal;

export const PopoverContent = ({
  className,
  align = "center",
  sideOffset = 8,
  portalled = true,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & { portalled?: boolean }) => {
  const content = (
    <PopoverPrimitive.Content
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 rounded-md bg-white shadow-[0_24px_70px_rgba(17,17,17,0.18)] outline-none",
        className,
      )}
      {...props}
    />
  );

  return portalled ? <PopoverPortal>{content}</PopoverPortal> : content;
};
