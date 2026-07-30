import * as React from "react";
import { cn } from "./utils";

type IconProps = React.SVGProps<SVGSVGElement>;

function icon(paths: React.ReactNode, displayName: string) {
  function Icon({ className, ...props }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("h-4 w-4 shrink-0", className)}
        aria-hidden
        {...props}
      >
        {paths}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const IconHome = icon(
  <>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20h14V9.5" />
  </>,
  "IconHome",
);

export const IconLayout = icon(
  <>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </>,
  "IconLayout",
);

export const IconPen = icon(
  <>
    <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
    <path d="m14.5 7.5 2 2" />
  </>,
  "IconPen",
);

export const IconShare = icon(
  <>
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
  </>,
  "IconShare",
);

export const IconGlobe = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21c-2.4-2.5-3.5-5.5-3.5-9S9.6 5.5 12 3Z" />
  </>,
  "IconGlobe",
);

export const IconCalendar = icon(
  <>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>,
  "IconCalendar",
);

export const IconCreditCard = icon(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h3" />
  </>,
  "IconCreditCard",
);

export const IconSearch = icon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
  "IconSearch",
);

export const IconMenu = icon(
  <>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </>,
  "IconMenu",
);

export const IconClose = icon(
  <>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </>,
  "IconClose",
);

export const IconLogout = icon(
  <>
    <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2" />
    <path d="M15 12H3" />
    <path d="m6 9-3 3 3 3" />
  </>,
  "IconLogout",
);

export const IconSettings = icon(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>,
  "IconSettings",
);

export const IconShield = icon(
  <>
    <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
  </>,
  "IconShield",
);

export const IconSparkles = icon(
  <>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="m6.5 6.5 2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5" />
  </>,
  "IconSparkles",
);

export const IconUsers = icon(
  <>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 19a6 6 0 0 1 12 0" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M15.5 19a5 5 0 0 1 5.5-4.7" />
  </>,
  "IconUsers",
);

export const IconBriefcase = icon(
  <>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 12h18" />
  </>,
  "IconBriefcase",
);

export const IconMail = icon(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </>,
  "IconMail",
);

export const IconBell = icon(
  <>
    <path d="M12 3a5 5 0 0 0-5 5v2.5c0 .8-.3 1.6-.8 2.2L5 14.5h14l-1.2-1.8c-.5-.6-.8-1.4-.8-2.2V8a5 5 0 0 0-5-5Z" />
    <path d="M10 17a2 2 0 0 0 4 0" />
  </>,
  "IconBell",
);

export const IconMessage = icon(
  <>
    <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 1 1 18 0Z" />
    <path d="M8 11h8M8 14h5" />
  </>,
  "IconMessage",
);

export const IconPlug = icon(
  <>
    <path d="M9 7V3M15 7V3" />
    <path d="M7 7h10v4a5 5 0 0 1-5 5v4M12 16v5" />
  </>,
  "IconPlug",
);
