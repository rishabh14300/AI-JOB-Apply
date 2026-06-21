import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Briefcase, Plus, Trash2, X, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Job {
  id: number;
  title: string;
  company: string;
  description: string;
  status: string;
  created_at: string;
}

export default function JobInput() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', company: '', description: '' });

  const fetchJobs = useCallback(async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data.jobs);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/jobs', form);
      toast.success('Job saved!');
      setForm({ title: '', company: '', description: '' });
      setShowForm(false);
      fetchJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/jobs/${id}`, { status });
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const deleteJob = async (id: number) => {
    try {
      await api.delete(`/jobs/${id}`);
      setJobs(prev => prev.filter(j => j.id !== id));
      toast.success('Job deleted');
    } catch {
      toast.error('Failed to delete job');
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'badge-info';
      case 'interview': return 'badge-warning';
      case 'offer': return 'badge-success';
      case 'rejected': return 'badge-danger';
      default: return 'badge-primary';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Job Tracker</h1>
          <p className="text-slate-400 mt-2">Manage your job applications</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Job</>}
        </button>
      </div>

      {/* Add Job Form */}
      {showForm && (
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4">Add New Job</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Job Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Senior Frontend Developer"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Google"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Job Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field min-h-[200px] resize-y"
                placeholder="Paste the full job description here..."
                required
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><div className="spinner" /> Saving...</> : <><Plus className="w-4 h-4" /> Save Job</>}
            </button>
          </form>
        </div>
      )}

      {/* Job List */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Your Jobs ({jobs.length})</h2>
        {loading ? (
          <div className="flex justify-center py-8"><div className="spinner" /></div>
        ) : jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map(job => (
              <div key={job.id} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 mt-0.5">
                      <Building2 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-white">{job.title}</h3>
                        <span className={`badge ${statusColor(job.status)}`}>{job.status}</span>
                      </div>
                      <p className="text-sm text-slate-400">{job.company}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{job.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <select
                          value={job.status}
                          onChange={(e) => updateStatus(job.id, e.target.value)}
                          className="text-xs bg-transparent border border-slate-600 rounded-lg px-2 py-1 text-slate-300 outline-none cursor-pointer"
                        >
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No jobs tracked yet</p>
            <p className="text-sm text-slate-500 mt-1">Click "Add Job" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
