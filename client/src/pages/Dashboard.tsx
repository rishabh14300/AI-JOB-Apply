import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FileText, Briefcase, Mail, TrendingUp, Clock, Sparkles } from 'lucide-react';

interface DashboardData {
  stats: { resumes: number; jobs: number; coverLetters: number };
  recentJobs: Array<{ id: number; title: string; company: string; status: string; created_at: string }>;
  recentResumes: Array<{ id: number; filename: string; created_at: string }>;
  recentCoverLetters: Array<{ id: number; job_title: string; company: string; created_at: string }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Resumes Uploaded', value: data?.stats.resumes || 0, icon: FileText, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-500/10' },
    { label: 'Jobs Tracked', value: data?.stats.jobs || 0, icon: Briefcase, color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-500/10' },
    { label: 'Cover Letters', value: data?.stats.coverLetters || 0, icon: Mail, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-500/10' },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ width: 40, height: 40 }} />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-400 mt-2">Here's your job search overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statCards.map((stat, i) => (
          <div
            key={stat.label}
            className={`glass-card p-6 animate-fade-in animate-fade-in-delay-${i + 1}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a href="/resumes" className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/10 hover:border-indigo-500/30 transition-all duration-200">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-medium text-slate-200">Upload Resume</span>
          </a>
          <a href="/optimize" className="flex items-center gap-3 p-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-200">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-medium text-slate-200">Optimize Resume</span>
          </a>
          <a href="/cover-letter" className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-200">
            <Mail className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-slate-200">Generate Cover Letter</span>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            Recent Jobs
          </h2>
          {data?.recentJobs && data.recentJobs.length > 0 ? (
            <div className="space-y-3">
              {data.recentJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{job.title}</p>
                    <p className="text-xs text-slate-400">{job.company}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${statusColor(job.status)}`}>{job.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No jobs tracked yet</p>
            </div>
          )}
        </div>

        {/* Recent Resumes */}
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Recent Resumes
          </h2>
          {data?.recentResumes && data.recentResumes.length > 0 ? (
            <div className="space-y-3">
              {data.recentResumes.map(resume => (
                <div key={resume.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                      <FileText className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-200">{resume.filename}</p>
                  </div>
                  <p className="text-xs text-slate-400">{formatDate(resume.created_at)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No resumes uploaded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
