const difficultyRank = { EASY: 1, MEDIUM: 2, HARD: 3 };
const statusRank = { not_started: 1, in_progress: 2, revision: 3, solved: 4, skipped: 5 };

export function splitParam(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(splitParam);
  return String(value).split(',').map((part) => part.trim()).filter(Boolean);
}

export function applyQuestionFilters(rows, query) {
  const search = String(query.search || '').trim().toLowerCase();
  const difficulties = new Set(splitParam(query.difficulty).map((d) => d.toUpperCase()));
  const companies = splitParam(query.company).map((c) => c.toLowerCase());
  const topics = splitParam(query.topic).map((t) => t.toLowerCase());
  const windows = splitParam(query.window).map((w) => w.toLowerCase());
  const statuses = new Set(splitParam(query.status));
  const favorite = query.favorite === 'true' || query.favorite === true;
  const priority = String(query.priority || '').trim().toLowerCase();
  const reviewDue = query.reviewDue === 'true' || query.reviewDue === true;
  const today = new Date().toISOString().slice(0, 10);

  return rows.filter((q) => {
    const p = q.progress || {};
    if (search) {
      const haystack = [q.title, q.slug, q.platform, q.difficulty, ...(q.topics || []), ...(q.companies || [])]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (difficulties.size && !difficulties.has(q.difficulty)) return false;
    if (companies.length && !companies.some((company) => (q.companies || []).some((c) => c.toLowerCase() === company))) return false;
    if (topics.length && !topics.some((topic) => (q.topics || []).some((t) => t.toLowerCase() === topic))) return false;
    if (windows.length && !windows.some((window) => (q.timeWindows || []).some((w) => w.toLowerCase() === window))) return false;
    if (statuses.size && !statuses.has(p.status || 'not_started')) return false;
    if (favorite && !p.favorite) return false;
    if (priority && p.priority !== priority) return false;
    if (reviewDue && !(p.nextReviewAt && p.nextReviewAt <= today && p.status !== 'solved')) return false;
    return true;
  });
}

export function sortQuestions(rows, sort = 'title', direction = 'asc') {
  const dir = direction === 'desc' ? -1 : 1;
  const getValue = (q) => {
    switch (sort) {
      case 'difficulty': return difficultyRank[q.difficulty] || 99;
      case 'companyCount': return q.companyCount || 0;
      case 'frequency': return q.maxFrequency ?? -1;
      case 'acceptance': return q.avgAcceptanceRate ?? -1;
      case 'status': return statusRank[q.progress?.status || 'not_started'] || 99;
      case 'updated': return q.progress?.updatedAt || '';
      case 'title':
      default: return q.title || '';
    }
  };
  return [...rows].sort((a, b) => {
    const av = getValue(a);
    const bv = getValue(b);
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }) * dir;
  });
}

export function paginate(rows, page = 1, limit = 50) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 500);
  const total = rows.length;
  const totalPages = Math.max(Math.ceil(total / safeLimit), 1);
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * safeLimit;
  return {
    rows: rows.slice(start, start + safeLimit),
    pagination: { page: currentPage, limit: safeLimit, total, totalPages }
  };
}

export function toCsv(rows) {
  const headers = [
    'ID', 'Title', 'Difficulty', 'Status', 'Favorite', 'Priority', 'Last Reviewed', 'Next Review',
    'Notes', 'Tags', 'Link', 'Companies', 'Topics', 'Time Windows'
  ];
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const lines = rows.map((q) => {
    const p = q.progress || {};
    return [
      q.id, q.title, q.difficulty, p.status || 'not_started', p.favorite ? 'yes' : 'no', p.priority || 'medium',
      p.lastReviewedAt || '', p.nextReviewAt || '', p.notes || '', (p.tags || []).join('|'), q.link,
      (q.companies || []).join('|'), (q.topics || []).join('|'), (q.timeWindows || []).join('|')
    ].map(escape).join(',');
  });
  return [headers.map(escape).join(','), ...lines].join('\n');
}
