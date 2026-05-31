export function ProgressBar({ value = 0, label }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress-wrap" aria-label={label || `Progress ${safeValue}%`}>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${safeValue}%` }} />
      </div>
      <span>{safeValue}%</span>
    </div>
  );
}
