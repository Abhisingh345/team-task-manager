import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, isOverdue, getStatusBadgeClass, getPriorityBadgeClass, getInitials, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';
import './ProjectDetailPage.css';

const STATUSES = ['Todo', 'In Progress', 'Review', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

function TaskCard({ task, onEdit, onDelete }) {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <div className={`task-card ${overdue ? 'overdue' : ''}`}>
      <div className="task-card-header">
        <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>{task.priority}</span>
        <div className="task-card-actions">
          <button onClick={() => onEdit(task)} title="Edit">✏️</button>
          <button onClick={() => onDelete(task._id)} title="Delete">🗑️</button>
        </div>
      </div>
      <div className="task-card-title">{task.title}</div>
      {task.description && <p className="task-card-desc">{task.description}</p>}
      <div className="task-card-footer">
        {task.assignedTo ? (
          <div className="assignee">
            <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>
              {getInitials(task.assignedTo.name)}
            </div>
            <span>{task.assignedTo.name}</span>
          </div>
        ) : <span className="unassigned">Unassigned</span>}
        {task.dueDate && (
          <span className={`due ${overdue ? 'overdue-text' : ''}`}>📅 {formatDate(task.dueDate)}</span>
        )}
      </div>
    </div>
  );
}

function TaskModal({ task, project, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = !!task?._id;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: task?.assignedTo?._id || '',
    status: task?.status || 'Todo',
    priority: task?.priority || 'Medium',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title required'); return; }
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await api.put(`/tasks/${task._id}`, form);
      } else {
        res = await api.post('/tasks', { ...form, project: project._id });
      }
      toast.success(isEdit ? 'Task updated!' : 'Task created!');
      onSaved(res.data.task, isEdit);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Task' : 'Create Task'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input className="form-control" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows={3} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Assign To</label>
              <select className="form-control" value={form.assignedTo}
                onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {project.members?.map(m => (
                  <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input className="form-control" type="date" value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ project, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/projects/${project._id}/members`, { email, role });
      toast.success('Member added!');
      onAdded(res.data.project);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Member</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input className="form-control" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="member@example.com" required />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
              <option>Member</option>
              <option>Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [projRes, taskRes, statsRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
        api.get(`/projects/${id}/stats`),
      ]);
      setProject(projRes.data.project);
      setTasks(taskRes.data.tasks);
      setStats(statsRes.data.stats);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const isAdmin = () => {
    if (!project || !user) return false;
    if (project.owner?._id === user._id) return true;
    const m = project.members?.find(m => m.user?._id === user._id);
    return m?.role === 'Admin';
  };

  const handleTaskSaved = (task, isEdit) => {
    if (isEdit) {
      setTasks(tasks.map(t => t._id === task._id ? task : t));
    } else {
      setTasks([task, ...tasks]);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setProject({ ...project, members: project.members.filter(m => m.user._id !== userId) });
      toast.success('Member removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!project) return null;

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="project-detail-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/projects')}>← Projects</button>
          <h1 className="page-title" style={{ marginTop: 4 }}>{project.name}</h1>
          {project.description && <p className="project-desc-text">{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isAdmin() && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>+ Member</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>+ Task</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>🗑️</button>
            </>
          )}
          {!isAdmin() && (
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>+ Task</button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="stats-bar">
          {[
            { label: 'Total', value: stats.total, color: '#6366f1' },
            { label: 'Todo', value: stats.todo, color: '#64748b' },
            { label: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
            { label: 'Review', value: stats.review, color: '#f59e0b' },
            { label: 'Done', value: stats.done, color: '#10b981' },
            { label: 'Overdue', value: stats.overdue, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} className="stats-bar-item">
              <div className="stats-bar-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stats-bar-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['board', 'list', 'members'].map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}>
            {t === 'board' ? '📋 Board' : t === 'list' ? '📝 List' : '👥 Members'}
          </button>
        ))}
      </div>

      {/* Board View */}
      {activeTab === 'board' && (
        <div className="kanban-board">
          {STATUSES.map(status => (
            <div key={status} className="kanban-column">
              <div className="kanban-header">
                <span className={`badge ${getStatusBadgeClass(status)}`}>{status}</span>
                <span className="kanban-count">{tasksByStatus[status]?.length || 0}</span>
              </div>
              <div className="kanban-cards">
                {tasksByStatus[status]?.map(task => (
                  <TaskCard key={task._id} task={task}
                    onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }}
                    onDelete={handleDeleteTask} />
                ))}
                {tasksByStatus[status]?.length === 0 && (
                  <div className="kanban-empty">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="card">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="icon">✅</div>
              <h3>No tasks yet</h3>
              <p>Create the first task for this project</p>
            </div>
          ) : (
            <table className="task-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task._id} className={isOverdue(task.dueDate, task.status) ? 'overdue-row' : ''}>
                    <td className="task-title-cell">{task.title}</td>
                    <td><span className={`badge ${getStatusBadgeClass(task.status)}`}>{task.status}</span></td>
                    <td><span className={`badge ${getPriorityBadgeClass(task.priority)}`}>{task.priority}</span></td>
                    <td>{task.assignedTo?.name || '—'}</td>
                    <td className={isOverdue(task.dueDate, task.status) ? 'overdue-text' : ''}>{formatDate(task.dueDate)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => { setEditingTask(task); setShowTaskModal(true); }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Members View */}
      {activeTab === 'members' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Team Members ({project.members?.length})</h3>
            {isAdmin() && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>+ Add Member</button>
            )}
          </div>
          <div className="members-list">
            {project.members?.map(m => (
              <div key={m.user?._id} className="member-row">
                <div className="avatar">{getInitials(m.user?.name)}</div>
                <div className="member-info">
                  <div className="member-name">
                    {m.user?.name}
                    {m.user?._id === project.owner?._id && <span className="owner-badge">Owner</span>}
                  </div>
                  <div className="member-email">{m.user?.email}</div>
                </div>
                <span className={`badge ${m.role === 'Admin' ? 'badge-inprogress' : 'badge-todo'}`}>{m.role}</span>
                {isAdmin() && m.user?._id !== project.owner?._id && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.user._id)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          project={project}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSaved={handleTaskSaved}
        />
      )}
      {showMemberModal && (
        <AddMemberModal
          project={project}
          onClose={() => setShowMemberModal(false)}
          onAdded={(p) => setProject(p)}
        />
      )}
    </div>
  );
}
