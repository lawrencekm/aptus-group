// Small inline icon set (no icon library dependency).
import type { ReactNode } from "react";

type Name =
  | "shield" | "warehouse" | "plane" | "ship" | "stamp" | "truck" | "phone" | "mail" | "pin" | "clock"
  | "search" | "check" | "arrow" | "lock" | "copy" | "edit" | "trash" | "eye" | "plus" | "upload"
  | "link" | "refresh" | "logout" | "activity" | "box" | "inbox" | "x" | "menu" | "whatsapp" | "print"
  | "file" | "send" | "download";

const paths: Record<Name, ReactNode> = {
  file: <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zm0 0v5h5M9 13h6M9 17h6" />,
  send: <path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" />,
  download: <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />,
  shield: <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3zm-3 9l2 2 4-4" />,
  warehouse: <path d="M3 21V9l9-5 9 5v12M7 21v-8h10v8M7 17h10" />,
  plane: <path d="M10.5 13.5L3 11l1.5-1.5 8 1L17 6c.8-.8 2.2-.8 3 0s.8 2.2 0 3l-4.5 4.5 1 8L15 23l-2.5-7.5L9 19v3l-1.5 1-1-4-4-1 1-1.5h3z" />,
  ship: <path d="M3 18c1.5 1.3 3 2 4.5 2s3-.7 4.5-2c1.5 1.3 3 2 4.5 2s3-.7 4.5-2M4 15l-1-5h18l-1 5M7 10V6h10v4M12 3v3" />,
  stamp: <path d="M5 21h14M6 17h12v-3a2 2 0 00-2-2h-2.5V9.5a3 3 0 10-3 0V12H8a2 2 0 00-2 2v3z" />,
  truck: <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7M7.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  mail: <path d="M3 6h18v12H3zM3 7l9 6 9-6" />,
  pin: <path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21zm0-9a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />,
  clock: <path d="M12 21a9 9 0 100-18 9 9 0 000 18zm0-13v5l3 2" />,
  search: <path d="M11 18a7 7 0 100-14 7 7 0 000 14zm9 3l-4-4" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h14m-5-5l5 5-5 5" />,
  lock: <path d="M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 017 0v3" />,
  copy: <path d="M9 9h11v11H9zM5 15H4V4h11v1" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />,
  trash: <path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  eye: <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  upload: <path d="M12 16V4m-5 5l5-5 5 5M4 16v4h16v-4" />,
  link: <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />,
  refresh: <path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" />,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  box: <path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5zM3 7.5L12 12l9-4.5M12 12v9" />,
  inbox: <path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 2h6l1-2h5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  whatsapp: <path d="M4 20l1.3-4A8 8 0 1112 20a8 8 0 01-3.9-1L4 20zm5-11.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8a5 5 0 01-2.8-2.8l.8-1-1-2-1.5 1z" />,
  print: <path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" />,
};

export function Icon({ name, className = "h-5 w-5", strokeWidth = 1.8 }: { name: Name; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export type IconName = Name;
