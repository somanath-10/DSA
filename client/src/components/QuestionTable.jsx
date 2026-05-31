import { ExternalLink, Star } from 'lucide-react';

function Tag({ children }) {
  return <span className="tag">{children}</span>;
}

export function QuestionTable({ questions, onUpdateProgress, pagination, setFilters }) {
  return (
    <section className="panel table-panel">
      <div className="table-toolbar">
        <div>
          <h2>Questions</h2>
          <p>{pagination?.total || 0} matching questions</p>
        </div>
        <div className="pagination-actions">
          <button disabled={(pagination?.page || 1) <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}>Prev</button>
          <span>Page {pagination?.page || 1} / {pagination?.totalPages || 1}</span>
          <button disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1)} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}>Next</button>
        </div>
      </div>
      <div className="table-scroll">
        <table className="questions-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Done</th>
              <th>Question</th>
              <th>Difficulty</th>
              <th>Companies</th>
              <th>Topics</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const p = q.progress || {};
              return (
                <tr key={q.id} className={p.status === 'solved' ? 'solved-row' : ''}>
                  <td>
                    <button 
                      className={p.status === 'solved' ? 'custom-checkbox checked' : 'custom-checkbox'} 
                      onClick={() => onUpdateProgress(q.id, { status: p.status === 'solved' ? 'not_started' : 'solved' })}
                      aria-label="Toggle completed"
                    >
                      <span className="checkbox-inner"></span>
                    </button>
                  </td>
                  <td className="question-cell">
                    <div className="question-title-row">
                      <button className={p.favorite ? 'star active' : 'star'} onClick={() => onUpdateProgress(q.id, { favorite: !p.favorite })} aria-label="Toggle favorite"><Star size={16} fill={p.favorite ? 'currentColor' : 'none'} /></button>
                      <a href={q.link} target="_blank" rel="noreferrer" style={{ textDecoration: p.status === 'solved' ? 'line-through' : 'none', opacity: p.status === 'solved' ? 0.6 : 1 }}>{q.title} <ExternalLink size={14} /></a>
                    </div>
                    <small>#{q.id} · {q.platform} · seen in {q.sourceRowCount} source rows</small>
                  </td>
                  <td><span className={`difficulty ${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span></td>
                  <td className="compact-tags">{q.companies.slice(0, 4).map((c) => <Tag key={c}>{c}</Tag>)}{q.companies.length > 4 && <Tag>+{q.companies.length - 4}</Tag>}</td>
                  <td className="compact-tags">{q.topics.slice(0, 4).map((t) => <Tag key={t}>{t}</Tag>)}{q.topics.length > 4 && <Tag>+{q.topics.length - 4}</Tag>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
