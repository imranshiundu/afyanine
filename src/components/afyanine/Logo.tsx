export function LogoMark({ size = 35 }: { size?: number }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        {/* heart outline — the nine-month journey */}
        <path
          className="logo-heart"
          d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
        />
        {/* mother cradling her child, drawn inside the heart */}
        <g className="logo-figure" transform="translate(4.7 4.7) scale(0.6)">
          <circle cx="12" cy="5.2" r="2.7" />
          <path d="M8.4 21v-5.4a5.5 5.5 0 0 1 2-4.3" />
          <path d="M14.1 8.9c2.1.9 3.5 3 3.5 5.4V21" />
        </g>
        <circle className="logo-baby" cx="14.6" cy="14.6" r="1.5" />
      </svg>
    </span>
  );
}

export function Logo() {
  return (
    <div className="logo">
      <LogoMark />
      <span className="logo-word">
        Afya<b>Nine</b>
      </span>
    </div>
  );
}
