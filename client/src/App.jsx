import { useEffect, useState } from 'react';
import { api } from './utils/api';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Filters } from './components/Filters';
import { QuestionTable } from './components/QuestionTable';
import { GroupedViews } from './components/GroupedViews';
import './styles.css';

const defaultFilters = {
  search: '',
  difficulty: '',
  company: '',
  topic: '',
  window: '',
  status: '',
  priority: '',
  sort: 'title',
  direction: 'asc',
  page: 1,
  limit: 50
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [questionPayload, setQuestionPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');

  const queryFilters = filters;

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [metaResult, questionResult] = await Promise.all([api.meta(), api.questions(queryFilters)]);
      setMeta(metaResult);
      setQuestionPayload(questionResult);
    } catch (err) {
      setError(err.message || 'Could not load data');
    } finally {
      setLoading(false);
    }
  }

  async function refreshQuestions(nextFilters = queryFilters) {
    const questionResult = await api.questions(nextFilters);
    setQuestionPayload(questionResult);
  }

  useEffect(() => {
    loadAll();
  }, [JSON.stringify(queryFilters)]);

  async function updateProgress(id, patch) {
    try {
      await api.updateProgress(id, patch);
      await refreshQuestions();
    } catch (err) {
      setToast(err.message || 'Unable to update progress');
    }
  }

  async function resetProgress() {
    const ok = window.confirm('Reset all progress, notes, favorites, and review dates?');
    if (!ok) return;
    await api.resetProgress();
    await refreshQuestions();
    setToast('Progress reset');
  }

  async function importProgress(backup) {
    await api.importProgress(backup);
    await refreshQuestions();
    setToast('Progress backup imported');
  }

  const stats = questionPayload?.stats;
  const questions = questionPayload?.items || [];
  const pagination = questionPayload?.pagination;
  const viewFilters = filters;

  return (
    <div className="app-shell">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} filters={viewFilters} onReset={resetProgress} onImport={importProgress} />
      {toast && <button className="toast" onClick={() => setToast('')}>{toast}</button>}
      {error && <div className="error-box">{error}</div>}
      {loading && !questionPayload ? <div className="loading">Loading tracker...</div> : (
        <main>
          {activeTab === 'dashboard' && <Dashboard stats={stats} meta={meta} />}
          {activeTab === 'questions' && (
            <>
              <Filters meta={meta} filters={filters} setFilters={setFilters} onClear={() => setFilters(defaultFilters)} />
              <QuestionTable
                questions={questions}
                onUpdateProgress={updateProgress}
                pagination={pagination}
                setFilters={setFilters}
              />
            </>
          )}
          {activeTab === 'companies' && (
            <GroupedViews title="Company progress" rows={stats?.companies || []} filterKey="company" setFilters={setFilters} setActiveTab={setActiveTab} />
          )}
          {activeTab === 'topics' && (
            <GroupedViews title="Topic progress" rows={stats?.topics || []} filterKey="topic" setFilters={setFilters} setActiveTab={setActiveTab} />
          )}
        </main>
      )}
    </div>
  );
}
