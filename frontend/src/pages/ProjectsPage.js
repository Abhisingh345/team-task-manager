import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDate, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';
import './ProjectsPage.css';

const statusColors = {
  'Active': '#10b981',
  'Completed': '#6366f1',
  'On Hold': '#f59e0b',
  'Cancelled': '#ef4444',
};

function ProjectCard({ project, onDelete }) {
  const isOwnerOrAdmin = () => {
    const member = project.members?.find(m => m.user?._id === project.owner?._id);
    return true; // simplified - check on backend
  };

  return (
    <div className="project-card">
      <div className="project-card-header">
        <div className="project-status-dot" style={{ background: statusColors[project.status] }} />
        <span className="project-status">{project.status}</span>
      </div>
      <h3 className="project-name">{project.name}</h3>
      {project.description && <p className="project-desc">{project.description}</p>}
      <div className="project-meta">
        <div className="meta-item">
          <span>👥</span>
          <span>{project.members?.length || 0} members</span>
        </div>
        {project.dueDate && (
          <div className="meta-item">
            <span>📅</span>
            <span>{formatDate(project.dueDate)}</span>
          </div>
        )}
      </div>
      <div className="project-footer">
        <div className="owner-info">
          <div className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
            {project.owner?.name?.[0]?.toUpperCase()}
          </div>
          <span>{project.owner?.name}</span>
        </div>
        <div className="project-actions">
          <Link to={`/projects/${project._id}`} className="btn btn-secondary btn-sm">Open →</Link>
        </div>
      </div>
    </div>
  );
}

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', dueDate: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Project name required'); return; }
    setLoading(true);
    try {
      const res = await api.post('/projects', form);
      toast.success('Project created!');
      onCreated(res.data.project);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Project</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Name *</label>
            <input className="form-control" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Website Redesign" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows={3} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input className="form-control" type="date" value={form.dueDate}
              onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.get('/projects')
      .then(res => setProjects(res.data.projects))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? projects : projects.filter(p => p.status === filter);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📁 Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      <div className="filter-tabs">
        {['All', 'Active', 'On Hold', 'Completed', 'Cancelled'].map(s => (
          <button key={s} className={`filter-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="icon">📁</div>
          <h3>No projects found</h3>
          <p>Create a new project to get started</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>+ Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map(p => (
            <ProjectCard key={p._id} project={p} />
          ))}
        </div>
      )}

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreated={(p) => setProjects([p, ...projects])}
        />
      )}
    </div>
  );
}
