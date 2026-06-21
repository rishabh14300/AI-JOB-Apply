import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { FileText, Upload, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Resume {
  id: number;
  filename: string;
  content_length: number;
  created_at: string;
}

export default function ResumeUpload() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchResumes = useCallback(async () => {
    try {
      const res = await api.get('/resumes');
      setResumes(res.data.resumes);
    } catch {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setSelectedFile(file);
    } else {
      toast.error('Only PDF and DOCX files are allowed');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Resume uploaded successfully!');
      setSelectedFile(null);
      fetchResumes();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/resumes/${id}`);
      toast.success('Resume deleted');
      setResumes(prev => prev.filter(r => r.id !== id));
    } catch {
      toast.error('Failed to delete resume');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Resume Management</h1>
        <p className="text-slate-400 mt-2">Upload and manage your resumes</p>
      </div>

      {/* Upload Zone */}
      <div className="glass-card p-8">
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
            ${dragActive
              ? 'border-indigo-400 bg-indigo-500/10'
              : selectedFile
                ? 'border-emerald-400/50 bg-emerald-500/5'
                : 'border-slate-600 hover:border-indigo-400/50 hover:bg-indigo-500/5'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{selectedFile.name}</p>
                <p className="text-sm text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button onClick={handleUpload} disabled={uploading} className="btn-primary">
                  {uploading ? <><div className="spinner" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Resume</>}
                </button>
                <button onClick={() => setSelectedFile(null)} className="btn-secondary">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Drop your resume here</p>
                <p className="text-sm text-slate-400">or click to browse • PDF, DOCX up to 10MB</p>
              </div>
              <label className="btn-primary cursor-pointer inline-flex">
                <Upload className="w-4 h-4" /> Browse Files
                <input type="file" accept=".pdf,.docx" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Resume List */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Your Resumes</h2>
        {loading ? (
          <div className="flex justify-center py-8"><div className="spinner" /></div>
        ) : resumes.length > 0 ? (
          <div className="space-y-3">
            {resumes.map(resume => (
              <div key={resume.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">{resume.filename}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(resume.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(resume.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No resumes uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
