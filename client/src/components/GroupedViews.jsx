import { ProgressBar } from './ProgressBar';

export function GroupedViews({ title, rows, filterKey, setFilters, setActiveTab }) {
  return (
    <section className="panel grouped-view">
      <div className="panel-title">
        <h2>{title}</h2>
        <p>Click any row to filter the question table.</p>
      </div>
      <div className="group-grid">
        {rows.map((row) => (
          <button
            className="group-card"
            key={row.name}
            onClick={() => {
              setFilters((prev) => ({ ...prev, [filterKey]: row.name, page: 1 }));
              setActiveTab('questions');
            }}
          >
            <span>{row.name}</span>
            <strong>{row.solved}/{row.total}</strong>
            <ProgressBar value={row.completionPercent} />
          </button>
        ))}
      </div>
    </section>
  );
}
