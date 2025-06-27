
import React from "react";
import { cn } from "../../lib/utils";

const universalBadgeBaseClasses =  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-white";

const Badge = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn( universalBadgeBaseClasses, className)}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };