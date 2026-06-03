const ICON_PATHS: Record<string, string> = {
  dashboard:  '<rect x="3" y="3" width="7" height="9" rx="1.2"/><rect x="14" y="3" width="7" height="5" rx="1.2"/><rect x="14" y="12" width="7" height="9" rx="1.2"/><rect x="3" y="16" width="7" height="5" rx="1.2"/>',
  tools:      '<path d="M3 7h13M3 12h18M3 17h9"/><circle cx="19" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
  grid:       '<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
  bell:       '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10.5 21a1.8 1.8 0 0 0 3 0"/>',
  report:     '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M5 21V5a2 2 0 0 1 2-2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M9 13h6M9 17h4"/>',
  settings:   '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 7 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 2.6 15H2.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 11 2.5V2.4a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 22.4 9v.09A1.65 1.65 0 0 0 21.5 11"/>',
  plus:       '<path d="M12 5v14M5 12h14"/>',
  search:     '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  chevDown:   '<path d="m6 9 6 6 6-6"/>',
  chevRight:  '<path d="m9 6 6 6-6 6"/>',
  chevLeft:   '<path d="m15 6-6 6 6 6"/>',
  arrowUp:    '<path d="M12 19V5M5 12l7-7 7 7"/>',
  arrowDown:  '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  arrowRight: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  check:      '<path d="M20 6 9 17l-5-5"/>',
  checkCircle:'<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>',
  x:          '<path d="M18 6 6 18M6 6l12 12"/>',
  alert:      '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z"/>',
  info:       '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  mail:       '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  whatsapp:   '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3z"/><path d="M8.5 9.5c0 3.3 2.7 6 6 6 .6 0 .8-.3.9-.7.1-.5.1-1 0-1.1-.2-.2-1.6-.8-1.8-.9-.3-.1-.5 0-.6.2l-.5.6c-.1.1-.2.1-.4 0a4.7 4.7 0 0 1-2.1-2.1c-.1-.2 0-.3 0-.4l.5-.6c.1-.2.1-.3 0-.5l-.7-1.6c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.3-.5.7-.5 1.5z"/>',
  zap:        '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  trend:      '<path d="M3 17l6-6 4 4 7-8"/><path d="M17 7h4v4"/>',
  trendDown:  '<path d="M3 7l6 6 4-4 7 8"/><path d="M17 17h4v-4"/>',
  clock:      '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar:   '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  refresh:    '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v5h-5"/>',
  download:   '<path d="M12 3v12M7 11l5 5 5-5"/><path d="M5 21h14"/>',
  upload:     '<path d="M12 21V9M7 13l5-5 5 5"/><path d="M5 21h14"/>',
  key:        '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.5 12.5 8-8M16 5l3 3M14 7l2 2"/>',
  lock:       '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  user:       '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users:      '<circle cx="9" cy="8" r="3.6"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 5.2A3.6 3.6 0 0 1 16 12M22 21a7 7 0 0 0-5-6.7"/>',
  building:   '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 21v-4h6v4M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/>',
  credit:     '<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/>',
  dollar:     '<path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.8 7 6.8 9 9.5 12 10s5 1.4 5 3.5-2.2 3.5-5 3.5-5-1.2-5-3"/>',
  more:       '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  filter:     '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
  external:   '<path d="M14 5h5v5M19 5l-8 8M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/>',
  link:       '<path d="M9 13a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-6-6l-1.5 1.5"/><path d="M15 11a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 6 6l1.5-1.5"/>',
  eye:        '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:     '<path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.3 3.9M6.2 6.2A16 16 0 0 0 2 12s3.5 6 10 6a9.7 9.7 0 0 0 4-.8"/><path d="m9.5 9.5a3 3 0 0 0 4.2 4.2M2 2l20 20"/>',
  logout:     '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  sparkles:   '<path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 14l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  pause:      '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  play:       '<path d="M6 4l14 8-14 8z"/>',
  edit:       '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash:      '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  copy:       '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  sun:        '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:       '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  layers:     '<path d="M12 2 2 7l10 5 10-5z"/><path d="M2 12l10 5 10-5M2 17l10 5 10-5"/>',
  pulse:      '<path d="M3 12h4l2-7 4 14 2-7h6"/>',
  slash:      '<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
  shield:     '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  category:   '<rect x="3" y="3" width="8" height="8" rx="1.4"/><circle cx="17.5" cy="7" r="4"/><path d="M3 15h8v6H3zM15 15h6v6h-6z"/>',
};

interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 16, stroke = 1.6, fill = "none", className = "", style = {} }: IconProps) {
  const path = ICON_PATHS[name] || "";
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={fill} stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}
