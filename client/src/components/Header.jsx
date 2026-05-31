import { BookOpenCheck, Download, RotateCcw, Upload } from 'lucide-react';
import { api } from '../utils/api';

export function Header({ activeTab, setActiveTab, filters, onReset, onImport }) {
  const tabs = [
    ['dashboard', 'Dashboard'],
    ['questions', 'Questions'],
    ['companies', 'Companies'],
    ['topics', 'Topics']
  ];

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onImport(JSON.parse(text));
    event.target.value = '';
  }

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon"><BookOpenCheck size={28} /></div>
        <div>
          <h1>DSA Progress Tracker</h1>
          <p>Unique company-wise problems with backend-saved progress.</p>
        </div>
      </div>
      <nav className="tabs" aria-label="Main navigation">
        {tabs.map(([key, label]) => (
          <button key={key} className={activeTab === key ? 'tab active' : 'tab'} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <a className="icon-button" href={api.exportCsvUrl(filters)}><Download size={16} /> CSV</a>
        <a className="icon-button" href={api.exportJsonUrl()}><Download size={16} /> Backup</a>
        <label className="icon-button file-label"><Upload size={16} /> Import <input type="file" accept="application/json" onChange={handleImport} /></label>
        <button className="icon-button danger" onClick={onReset}><RotateCcw size={16} /> Reset</button>
      </div>
    </header>
  );
}
