// client/src/lib/tailwindClassStrings.js

// Button Classes
export const BUTTON_BASE = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer";

// Converted custom colors to standard Tailwind colors
export const BUTTON_VARIANT_DEFAULT = "bg-blue-600 hover:bg-blue-700 text-white "; // Replaced primary
export const BUTTON_VARIANT_DESTRUCTIVE = "bg-red-600 text-white hover:bg-red-700"; // Replaced destructive
export const BUTTON_VARIANT_OUTLINE = "border border-gray-300 bg-white hover:bg-gray-100 hover:text-gray-900"; // Replaced input, background, accent, accent-foreground
export const BUTTON_VARIANT_SECONDARY = "bg-gray-200 text-gray-900 hover:bg-gray-300"; // Replaced secondary
export const BUTTON_VARIANT_GHOST = "hover:bg-gray-100 hover:text-gray-900 "; // Replaced accent, accent-foreground (already had gray-100)
export const BUTTON_VARIANT_LINK = "text-blue-600 underline-offset-4 hover:underline"; // Replaced primary

export const BUTTON_SIZE_DEFAULT = "h-10 px-4 py-2";
export const BUTTON_SIZE_SM = "h-9 rounded-md px-3";
export const BUTTON_SIZE_LG = "h-11 rounded-md px-8";
export const BUTTON_SIZE_ICON = "h-10 w-10";


// Badge Classes
export const BADGE_BASE = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-white";

// Converted custom colors to standard Tailwind colors
export const BADGE_VARIANT_DEFAULT = "border-transparent bg-blue-600 text-white hover:bg-blue-00"; // Replaced primary
export const BADGE_VARIANT_SECONDARY = "border-transparent bg-gray-200 text-gray-900 hover:bg-gray-300"; // Replaced secondary
export const BADGE_VARIANT_DESTRUCTIVE = "border-transparent bg-red-600 text-white hover:bg-red-700"; // Replaced destructive
export const BADGE_VARIANT_OUTLINE = "text-gray-900"; // Replaced foreground


// Alert Classes
export const ALERT_BASE = "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-900"; // Replaced foreground

// Converted custom colors to standard Tailwind colors
export const ALERT_VARIANT_DEFAULT = "bg-white text-gray-900"; // Replaced background, foreground
export const ALERT_VARIANT_DESTRUCTIVE = "border-red-500/50 text-red-700 dark:border-red-500 [&>svg]:text-red-500"; // Replaced destructive
export const ALERT_VARIANT_SUCCESS = "border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-500";


// Label Classes
export const LABEL_BASE = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";