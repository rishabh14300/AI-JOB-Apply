import { useState, useEffect } from 'react';
import api from '../services/api';
import { Sparkles, Target, AlertTriangle, CheckCircle, Lightbulb, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Resume { id: number; filename: string; }
interface Job { id: number; title: string; company: string; }
interface Analysis {
  atsScore: number;
  summary: string;
  missingKeywords: string[];
  suggestions: Array<{ category: string; suggestion: string }>;
  strengths: string[];
  weaknesses: string[];
}

export default function ResumeOptimizer() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/resumes'), api.get('/jobs')])
      .then(([r, j]) => {
        setResumes(r.data.resumes);
        setJobs(j.data.jobs);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setPageLoading(false));
  }, []);

  const handleOptimize = async () => {
    if (!selectedResume || !selectedJob) {
      toast.error('Please select both a resume and a job');
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await api.post('/ai/optimize', {
        resumeId: parseInt(selectedResume),
        jobId: parseInt(selectedJob),
      });
      setAnalysis(res.data.analysis);
      toast.success('Analysis complete!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const scoreColor = analysis ? getScoreColor(analysis.atsScore) : '#6366f1';
  const circumference = 2 * Math.PI * 56;
  const offset = analysis ? circumference - (analysis.atsScore / 100) * circumference : circumference;

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
        <h1 className="text-3xl font-bold text-white">AI Resume Optimizer</h1>
        <p className="text-slate-400 mt-2">Compare your resume against a job description with AI</p>
      </div>

      {/* Selection */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Resume</label>
            <select
              value={selectedResume}
              onChange={(e) => setSelectedResume(e.target.value)}
              className="input-field"
            >
              <option value="">Choose a resume...</option>
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.filename}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Job</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="input-field"
            >
              <option value="">Choose a job...</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title} at {j.company}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleOptimize}
          disabled={loading || !selectedResume || !selectedJob}
          className="btn-primary"
        >
          {loading ? <><div className="spinner" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Analyze Resume</>}
        </button>
      </div>

      {/* Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Score + Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-8 flex flex-col items-center justify-center animate-fade-in">
              <p className="text-sm font-medium text-slate-400 mb-4">ATS Score</p>
              <div className="score-ring">
                <svg width="140" height="140">
                  <circle cx="70" cy="70" r="56" stroke="rgba(148,163,184,0.1)" strokeWidth="10" fill="none" />
                  <circle
                    cx="70" cy="70" r="56"
                    stroke={scoreColor}
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                  />
                </svg>
                <div className="score-value" style={{ color: scoreColor }}>
                  {analysis.atsScore}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                {analysis.atsScore >= 80 ? 'Excellent Match' : analysis.atsScore >= 60 ? 'Good Match' : 'Needs Improvement'}
              </p>
            </div>

            <div className="lg:col-span-2 glass-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" /> Summary
              </h3>
              <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>
            </div>
          </div>

          {/* Missing Keywords */}
          {analysis.missingKeywords.length > 0 && (
            <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-1">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.missingKeywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-2">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> Strengths
              </h3>
              <div className="space-y-2">
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 animate-fade-in animate-fade-in-delay-3">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" /> Areas to Improve
              </h3>
              <div className="space-y-2">
                {analysis.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{w}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-cyan-400" /> Improvement Suggestions
              </h3>
              <div className="space-y-3">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border-l-2 border-indigo-500">
                    <span className="badge badge-primary mb-2 inline-block">{s.category}</span>
                    <p className="text-sm text-slate-300">{s.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!analysis && !loading && (
        <div className="glass-card p-12 text-center">
          <Sparkles className="w-12 h-12 text-indigo-400/50 mx-auto mb-4" />
          <p className="text-slate-400">Select a resume and job to run AI analysis</p>
        </div>
      )}
    </div>
  );
}
