export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`overyn-brand ${compact ? 'is-compact' : ''}`}>
      <span className="overyn-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {!compact ? <strong>Overyn</strong> : null}
    </div>
  );
}
