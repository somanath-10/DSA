export function BulkActions({ selectedIds, onBulkUpdate, clearSelection }) {
  if (!selectedIds.length) return null;

  return (
    <section className="bulk-actions">
      <strong>{selectedIds.length} selected</strong>
      <button onClick={() => onBulkUpdate(selectedIds, { status: 'solved' })}>Mark as Solved</button>
      <button className="ghost" onClick={() => onBulkUpdate(selectedIds, { status: 'not_started' })}>Mark as Unsolved</button>
      <button className="ghost" onClick={clearSelection}>Clear Selection</button>
    </section>
  );
}
