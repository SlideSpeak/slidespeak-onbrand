import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as SelectPrimitive from "@radix-ui/react-select";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

type SelectTriggerProps = ComponentPropsWithRef<typeof SelectPrimitive.Trigger>;
type SelectScrollUpButtonProps = ComponentPropsWithRef<typeof SelectPrimitive.ScrollUpButton>;
type SelectScrollDownButtonProps = ComponentPropsWithRef<typeof SelectPrimitive.ScrollDownButton>;
type SelectContentProps = ComponentPropsWithRef<typeof SelectPrimitive.Content>;
type SelectLabelProps = ComponentPropsWithRef<typeof SelectPrimitive.Label>;
type SelectItemProps = ComponentPropsWithRef<typeof SelectPrimitive.Item>;

const SelectTrigger = ({ className, children, ref, ...props }: SelectTriggerProps) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "group flex h-10 w-full items-center justify-between gap-2 rounded-md border border-onbrand-charcoal/12 bg-onbrand-white px-4 py-2 text-sm font-normal text-onbrand-charcoal shadow-[0_6px_18px_rgba(17,17,17,0.04)] transition outline-none hover:border-onbrand-charcoal/22 focus:ring-2 focus:ring-onbrand-blue-200 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <HugeiconsIcon
        className="h-4 w-4 opacity-60 transition-transform duration-150 group-data-[state=open]:rotate-180"
        icon={ChevronDownIcon}
        strokeWidth={2}
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);

const SelectScrollUpButton = ({ className, ref, ...props }: SelectScrollUpButtonProps) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <HugeiconsIcon className="h-4 w-4" icon={ChevronUpIcon} strokeWidth={2} />
  </SelectPrimitive.ScrollUpButton>
);

const SelectScrollDownButton = ({ className, ref, ...props }: SelectScrollDownButtonProps) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <HugeiconsIcon className="h-4 w-4" icon={ChevronDownIcon} strokeWidth={2} />
  </SelectPrimitive.ScrollDownButton>
);

const SelectContent = ({
  className,
  children,
  position = "popper",
  ref,
  ...props
}: SelectContentProps) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border border-onbrand-charcoal/10 bg-onbrand-white text-onbrand-charcoal shadow-xl",
        position === "popper" &&
          "w-[var(--radix-select-trigger-width)] data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);

const SelectLabel = ({ className, ref, ...props }: SelectLabelProps) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1 text-[11px] font-normal text-onbrand-charcoal/55", className)}
    {...props}
  />
);

const SelectItem = ({ className, children, ref, ...props }: SelectItemProps) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default items-center rounded-sm py-2 pr-3 pl-8 text-sm transition outline-none select-none focus:bg-onbrand-blue-50 focus:text-onbrand-blue-600 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>span:last-child]:truncate",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3 w-3 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <HugeiconsIcon className="h-4 w-4" icon={CheckIcon} strokeWidth={2} />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue };
