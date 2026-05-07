function statusDotClass(status) {
  if (status === 'online') return 'status-card__dot status-card__dot--online'
  if (status === 'offline') return 'status-card__dot status-card__dot--offline'
  return 'status-card__dot status-card__dot--pending'
}

/**
 * @param {{
 *   title: string
 *   value: string
 *   detail?: string
 *   healthStatus?: 'online' | 'offline' | 'checking'
 *   variant?: 'default' | 'ambient'
 *   personality?: 'home' | 'signal'
 * }} props
 */
export default function StatusCard({
  title,
  value,
  detail,
  healthStatus,
  variant = 'default',
  personality,
}) {
  let root =
    variant === 'ambient'
      ? 'status-card status-card--ambient'
      : 'status-card'
  if (personality) root += ` status-card--personality-${personality}`

  return (
    <article className={root}>
      <div className="status-card__title">{title}</div>
      <div className="status-card__row">
        {healthStatus != null ? (
          <span className={statusDotClass(healthStatus)} aria-hidden />
        ) : null}
        <div className="status-card__value">{value}</div>
      </div>
      {detail ? <div className="status-card__detail">{detail}</div> : null}
    </article>
  )
}
