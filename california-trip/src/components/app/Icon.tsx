export type IconName = "home" | "map" | "route" | "bag" | "heart" | "cup" | "capsule" | "waze" | "pause" | "play" | "move" | "check" | "trash" | "mic" | "stop" | "photo" | "pin" | "plus" | "search" | "bell" | "candle" | "compass" | "spark";

export default function Icon({ name, className = "icon" }: { name: IconName; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {name === "home" && <><path {...p} d="M4 11 12 4l8 7" /><path {...p} d="M6 10v9h12v-9" /></>}
      {name === "map" && <><path {...p} d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path {...p} d="M9 4v14M15 6v14" /></>}
      {name === "route" && <><circle {...p} cx="6" cy="18" r="2.2" /><circle {...p} cx="18" cy="6" r="2.2" /><path {...p} d="M8 18h6a3.5 3.5 0 0 0 0-7h-4a3.5 3.5 0 0 1 0-7h6" /></>}
      {name === "bag" && <><rect {...p} x="4" y="8" width="16" height="12" rx="3" /><path {...p} d="M9 8V6a3 3 0 0 1 6 0v2M9 14l2 2 4-4" /></>}
      {name === "heart" && <path {...p} d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />}
      {name === "cup" && <><path {...p} d="M5 8h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Z" /><path {...p} d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v2M11 3v2" /></>}
      {name === "capsule" && <><rect {...p} x="3" y="5" width="18" height="14" rx="3" /><circle {...p} cx="9" cy="11" r="2" /><path {...p} d="m21 16-5-5-8 8" /></>}
      {name === "waze" && <><path {...p} d="M5 15a7 7 0 1 1 13-3.5c0 3-2 5.5-5 5.5H9" /><circle cx="9.5" cy="10.5" r="1" fill="currentColor" /><circle cx="14.5" cy="10.5" r="1" fill="currentColor" /><circle {...p} cx="8" cy="18.5" r="1.6" /><circle {...p} cx="15" cy="18.5" r="1.6" /></>}
      {name === "pause" && <><path {...p} d="M9 6v12M15 6v12" /></>}
      {name === "play" && <path {...p} d="M8 5v14l11-7L8 5Z" />}
      {name === "move" && <><path {...p} d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3" /></>}
      {name === "check" && <path {...p} d="m5 12 5 5L19 7" />}
      {name === "trash" && <><path {...p} d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>}
      {name === "mic" && <><rect {...p} x="9" y="3" width="6" height="11" rx="3" /><path {...p} d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>}
      {name === "stop" && <rect {...p} x="6" y="6" width="12" height="12" rx="2" />}
      {name === "photo" && <><rect {...p} x="3" y="5" width="18" height="15" rx="3" /><circle {...p} cx="12" cy="12.5" r="3.5" /><path {...p} d="M8 5l1.5-2h5L16 5" /></>}
      {name === "pin" && <><path {...p} d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z" /><circle {...p} cx="12" cy="9.5" r="2.5" /></>}
      {name === "plus" && <path {...p} d="M12 5v14M5 12h14" />}
      {name === "search" && <><circle {...p} cx="11" cy="11" r="6" /><path {...p} d="m20 20-4.5-4.5" /></>}
      {name === "bell" && <><path {...p} d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Z" /><path {...p} d="M10 20a2 2 0 0 0 4 0" /></>}
      {name === "compass" && <><circle {...p} cx="12" cy="12" r="9" /><path {...p} d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>}
      {name === "spark" && <path {...p} d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />}
      {name === "candle" && <><path {...p} d="M9 10h6v11H9z" /><path {...p} d="M12 3c1.5 2 1.5 3.5 0 5-1.5-1.5-1.5-3 0-5Z" /></>}
    </svg>
  );
}
