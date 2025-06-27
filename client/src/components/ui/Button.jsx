
import React from "react";
import { cn } from "../../lib/utils";
import { BUTTON_SIZE_DEFAULT } from "../../lib/tailwindClassStrings";

const universalButtonBaseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer";

const Button = React.forwardRef(
  // eslint-disable-next-line no-unused-vars
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = "button";
    return (
      <Comp
        className={cn(universalButtonBaseClasses, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };