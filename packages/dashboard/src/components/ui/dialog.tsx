import type React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

const DialogOverlay = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay
    className={cn(
      "data-[state=closed]:animate-out data-[state=open]:animate-in fixed inset-0 z-50 bg-onbrand-inverse/55",
      className,
    )}
    {...props}
  />
);

export const DialogContent = ({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        "data-[state=closed]:animate-out data-[state=open]:animate-in fixed top-1/2 left-1/2 z-50 max-h-[min(720px,calc(100vh-2rem))] w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-onbrand-charcoal/10 bg-onbrand-white shadow-[0_32px_120px_rgba(10,10,10,0.2)] outline-none",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-md text-onbrand-charcoal/55 transition hover:text-onbrand-blue-600 focus-visible:ring-2 focus-visible:ring-onbrand-blue-200 focus-visible:outline-none">
          <HugeiconsIcon className="h-4 w-4" icon={Cancel01Icon} strokeWidth={2} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
);
