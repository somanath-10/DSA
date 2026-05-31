import { CheckCircle2, Clock3, Star, Target, TrendingUp } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <article className="stat-card">
      <div className="stat-icon"><Icon size={22} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </article>
  );
}

function MiniBars({ title, rows }) {
  return (
    <section className="panel">
      <div className="panel-title"><h2>{title}</h2></div>
      <div className="bar-list">
        {rows.slice(0, 12).map((row) => (
          <div className="bar-row" key={row.name || row[0]}>
            <div className="bar-label">
              <span>{row.name || row[0]}</span>
              <b>{row.solved || 0}/{row.total || row[1]}</b>
            </div>
            <ProgressBar value={row.completionPercent || 0} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function Dashboard({ stats, meta }) {
  const status = stats?.statusCounts || {};
  const difficultyRows = Object.entries(stats?.difficulty || {}).map(([name, value]) => ({ name, ...value, completionPercent: value.total ? Math.round((value.solved / value.total) * 1000) / 10 : 0 }));

  return (
    <div className="dashboard-grid">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Dataset audit</p>
          <h2>{meta?.uniqueQuestions?.toLocaleString()} unique questions</h2>
          <p>
            Built from {meta?.companyFoldersChecked} companies and {meta?.csvSheetsScanned} source CSV sheets.
            {meta?.duplicateSourceRowsRemoved?.toLocaleString()} duplicate source rows were removed.
          </p>
        </div>
        <ProgressBar value={stats?.completionPercent || 0} label="Overall completion" />
      </section>

      <div className="stats-grid">
        <StatCard icon={Target} label="Total" value={stats?.total?.toLocaleString() || 0} sub="questions in current view" />
        <StatCard icon={CheckCircle2} label="Solved" value={stats?.solved?.toLocaleString() || 0} sub={`${stats?.completionPercent || 0}% complete`} />
        <StatCard icon={Clock3} label="In progress" value={status.in_progress || 0} sub="active problems" />
        <StatCard icon={TrendingUp} label="Revision" value={status.revision || 0} sub="needs revisit" />
        <StatCard icon={Star} label="Favorites" value={stats?.favorites || 0} sub="bookmarked" />
      </div>

      <section className="panel status-panel">
        <div className="panel-title"><h2>Status breakdown</h2></div>
        <div className="status-grid">
          {Object.entries({ not_started: 'Not Started', in_progress: 'In Progress', solved: 'Solved', revision: 'Revision', skipped: 'Skipped' }).map(([key, label]) => (
            <div className={`status-chip ${key}`} key={key}>
              <span>{label}</span>
              <strong>{status[key] || 0}</strong>
            </div>
          ))}
        </div>
      </section>

      <MiniBars title="By difficulty" rows={difficultyRows} />
      <MiniBars title="Top companies" rows={stats?.companies || []} />
      <MiniBars title="Top topics" rows={stats?.topics || []} />
    </div>
  );
}
