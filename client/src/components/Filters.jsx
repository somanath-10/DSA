import { Search, X } from 'lucide-react';
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '../utils/constants';

function Select({ label, value, onChange, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value || ''} onChange={(event) => onChange(event.target.value)}>{children}</select>
    </label>
  );
}

export function Filters({ meta, filters, setFilters, onClear }) {
  const options = meta?.filterOptions || { difficulties: [], companies: [], topics: [], timeWindows: [] };
  const update = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  return (
    <section className="filters panel">
      <label className="search-field">
        <Search size={18} />
        <input
          value={filters.search || ''}
          onChange={(event) => update('search', event.target.value)}
          placeholder="Search title, company, topic, slug..."
        />
      </label>
      <Select label="Difficulty" value={filters.difficulty} onChange={(value) => update('difficulty', value)}>
        <option value="">All</option>
        {options.difficulties.map((item) => <option key={item} value={item}>{item}</option>)}
      </Select>
      <Select label="Company" value={filters.company} onChange={(value) => update('company', value)}>
        <option value="">All companies</option>
        {options.companies.map((item) => <option key={item} value={item}>{item}</option>)}
      </Select>
      <Select label="Topic" value={filters.topic} onChange={(value) => update('topic', value)}>
        <option value="">All topics</option>
        {options.topics.map((item) => <option key={item} value={item}>{item}</option>)}
      </Select>
      <Select label="Window" value={filters.window} onChange={(value) => update('window', value)}>
        <option value="">All windows</option>
        {options.timeWindows.map((item) => <option key={item} value={item}>{item}</option>)}
      </Select>
      <button className="clear-button" onClick={onClear}><X size={16} /> Clear</button>
    </section>
  );
}
