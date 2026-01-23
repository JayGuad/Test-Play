function CorpayLogo({ compact = false, theme = 'light' }) {
  return (
    <div className={`corpay-logo ${compact ? 'compact' : ''} ${theme}`}>
      <span className="corpay-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" role="img">
          <defs>
            <linearGradient id="corpayMarkGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--corpay-teal)" />
              <stop offset="100%" stopColor="var(--corpay-blue)" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="20" fill="url(#corpayMarkGradient)" />
          <path
            d="M18 28l6-8 6 8"
            stroke="var(--white)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </span>
      {!compact && (
        <span className="corpay-logo-word">
          Corpay<span className="corpay-logo-accent">Vendor</span>
        </span>
      )}
    </div>
  )
}

export default CorpayLogo
