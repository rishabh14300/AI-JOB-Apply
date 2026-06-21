import { useState, useEffect } from 'react';
import api from '../services/api';
import { Mail, Copy, Download, Sparkles, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Resume { id: number; filename: string; }
interface Job { id: number; title: string; company: string; }

export default function CoverLetter() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [history, setHistory] = useState<Array<{ id: number; job_title: string; company: string; created_at: string }>>([]);

  useEffect(() => {
    Promise.all([api.get('/resumes'), api.get('/jobs'), api.get('/ai/cover-letters')])
      .then(([r, j, cl]) => {
        setResumes(r.data.resumes);
        setJobs(j.data.jobs);
        setHistory(cl.data.coverLetters);
      })
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedResume || !selectedJob) {
      toast.error('Please select both a resume and a job');
      return;
    }
    setLoading(true);
    setCoverLetter('');
    try {
      const res = await api.post('/ai/cover-letter', {
        resumeId: parseInt(selectedResume),
        jobId: parseInt(selectedJob),
      });
      setCoverLetter(res.data.coverLetter.content);
      setEditing(false);
      toast.success('Cover letter generated!');
      // Refresh history
      const cl = await api.get('/ai/cover-letters');
      setHistory(cl.data.coverLetters);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    toast.success('Copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cover-letter.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
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
        <h1 className="text-3xl font-bold text-white">AI Cover Letter Generator</h1>
        <p className="text-slate-400 mt-2">Generate tailored cover letters with AI</p>
      </div>

      {/* Selection */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Resume</label>
            <select value={selectedResume} onChange={(e) => setSelectedResume(e.target.value)} className="input-field">
              <option value="">Choose a resume...</option>
              {resumes.map(r => <option key={r.id} value={r.id}>{r.filename}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Job</label>
            <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} className="input-field">
              <option value="">Choose a job...</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title} at {j.company}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading || !selectedResume || !selectedJob} className="btn-primary">
          {loading ? <><div className="spinner" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Cover Letter</>}
        </button>
      </div>

      {/* Generated Cover Letter */}
      {coverLetter && (
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" /> Generated Cover Letter
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(!editing)} className="btn-secondary text-xs px-3 py-2">
                <Edit3 className="w-3.5 h-3.5" /> {editing ? 'Preview' : 'Edit'}
              </button>
              <button onClick={handleCopy} className="btn-secondary text-xs px-3 py-2">
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button onClick={handleDownload} className="btn-secondary text-xs px-3 py-2">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
          {editing ? (
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="input-field min-h-[400px] resize-y font-serif text-base leading-relaxed"
            />
          ) : (
            <div className="bg-white/5 rounded-xl p-8 font-serif text-base leading-relaxed text-slate-200 whitespace-pre-wrap">
              {coverLetter}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Previous Cover Letters</h3>
          <div className="space-y-3">
            {history.map(cl => (
              <div key={cl.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <Mail className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{cl.job_title}</p>
                    <p className="text-xs text-slate-400">{cl.company}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(cl.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!coverLetter && !loading && (
        <div className="glass-card p-12 text-center">
          <Mail className="w-12 h-12 text-indigo-400/50 mx-auto mb-4" />
          <p className="text-slate-400">Select a resume and job to generate a tailored cover letter</p>
        </div>
      )}
    </div>
  );
}
