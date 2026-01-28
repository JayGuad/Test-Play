function CorpayLogo({ compact = false, theme = 'light' }) {
  const wordmarkSrc = theme === 'dark' ? '/corpay-logo-light.svg' : '/corpay-logo.svg'
  const iconSrc = '/corpay-icon.svg'
  const iconAlt = compact ? 'Corpay' : ''

  return (
    <div className={`corpay-logo ${compact ? 'compact' : ''} ${theme}`}>
      <span className="corpay-logo-mark" aria-hidden={!compact}>
        <img src={iconSrc} alt={iconAlt} />
      </span>
      {!compact && (
        <span className="corpay-logo-word">
          <img src={wordmarkSrc} alt="Corpay" />
        </span>
      )}
    </div>
  )
}

export default CorpayLogo
