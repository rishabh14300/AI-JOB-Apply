import { useState, useEffect } from 'react';
import api from '../services/api';
import { MessageSquare, ChevronDown, ChevronUp, Sparkles, Brain, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';

interface Job { id: number; title: string; company: string; }
interface Question {
  question: string;
  category: string;
  difficulty: string;
  sampleAnswer: string;
  tips: string;
}

export default function InterviewPrep() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    api.get('/jobs')
      .then(res => setJobs(res.data.jobs))
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedJob) {
      toast.error('Please select a job');
      return;
    }
    setLoading(true);
    setQuestions([]);
    try {
      const res = await api.post('/ai/interview', { jobId: parseInt(selectedJob) });
      setQuestions(res.data.prep.questions || []);
      toast.success('Interview questions generated!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor = (d: string) => {
    switch (d.toLowerCase()) {
      case 'easy': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'hard': return 'badge-danger';
      default: return 'badge-primary';
    }
  };

  const categoryIcon = (c: string) => {
    switch (c.toLowerCase()) {
      case 'behavioral': return '🤝';
      case 'technical': return '⚙️';
      case 'situational': return '🎯';
      default: return '💼';
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">AI Interview Preparation</h1>
        <p className="text-slate-400 mt-2">Practice with AI-generated interview questions</p>
      </div>

      {/* Selection */}
      <div className="glass-card p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Select Job</label>
          <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} className="input-field max-w-md">
            <option value="">Choose a job...</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title} at {j.company}</option>)}
          </select>
        </div>
        <button onClick={handleGenerate} disabled={loading || !selectedJob} className="btn-primary">
          {loading ? <><div className="spinner" /> Generating Questions...</> : <><Brain className="w-4 h-4" /> Generate Questions</>}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <div className="spinner mx-auto mb-4" style={{ width: 48, height: 48 }} />
          <p className="text-slate-300 font-medium">AI is crafting your interview questions...</p>
          <p className="text-sm text-slate-400 mt-1">This may take a moment</p>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{questions.length} Questions Generated</h2>
            <div className="flex gap-2">
              {['Behavioral', 'Technical', 'Situational', 'Role-Specific'].map(cat => {
                const count = questions.filter(q => q.category.toLowerCase() === cat.toLowerCase()).length;
                return count > 0 ? (
                  <span key={cat} className="badge badge-primary">{cat}: {count}</span>
                ) : null;
              })}
            </div>
          </div>

          {questions.map((q, i) => (
            <div
              key={i}
              className="glass-card overflow-hidden animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <button
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                className="w-full p-5 flex items-start gap-4 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{categoryIcon(q.category)}</span>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-white text-[15px] leading-relaxed">{q.question}</p>
                    {expandedIdx === i ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge badge-info">{q.category}</span>
                    <span className={`badge ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span>
                  </div>
                </div>
              </button>

              {expandedIdx === i && (
                <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4 animate-fade-in">
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Sample Answer
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
                      {q.sampleAnswer}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" /> Tips
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed bg-cyan-500/5 rounded-xl p-4 border border-cyan-500/10">
                      {q.tips}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!questions.length && !loading && (
        <div className="glass-card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-indigo-400/50 mx-auto mb-4" />
          <p className="text-slate-400">Select a job to generate interview practice questions</p>
        </div>
      )}
    </div>
  );
}
