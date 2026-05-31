export const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'solved', label: 'Solved' },
  { value: 'revision', label: 'Revision' },
  { value: 'skipped', label: 'Skipped' }
];

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

export function statusLabel(value) {
  return STATUS_OPTIONS.find((item) => item.value === value)?.label || 'Not Started';
}

export function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
