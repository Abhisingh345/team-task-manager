import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, isOverdue, getStatusBadgeClass, getPriorityBadgeClass, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';
import './TasksPage.css';

const STATUSES = ['All', 'Todo', 'In Progress', 'Review', 'Done'];
const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Critical'];

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/tasks')
      .then(res => setTasks(res.data.tasks))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(t => t._id === taskId ? res.data.task : t));
      toast.success('Status updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filtered = tasks.filter(t => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
    if (myTasksOnly && t.assignedTo?._id !== user._id) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">✅ My Tasks</h1>
        <div className="tasks-count">{filtered.length} tasks</div>
      </div>

      {/* Filters */}
      <div className="tasks-filters card" style={{ marginBottom: 20 }}>
        <input
          className="form-control search-input"
          type="text"
          placeholder="🔍 Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filter-row">
          <div className="filter-group">
            <label>Status</label>
            <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Priority</label>
            <select className="form-control" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>My Tasks</label>
            <button
              className={`toggle-btn ${myTasksOnly ? 'active' : ''}`}
              onClick={() => setMyTasksOnly(!myTasksOnly)}
            >
              {myTasksOnly ? '✅ On' : '⬜ Off'}
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="icon">🔍</div>
          <h3>No tasks found</h3>
          <p>Try adjusting your filters or create tasks in a project</p>
        </div>
      ) : (
        <div className="tasks-list">
          {filtered.map(task => {
            const overdue = isOverdue(task.dueDate, task.status);
            return (
              <div key={task._id} className={`task-row card ${overdue ? 'overdue-card' : ''}`}>
                <div className="task-row-main">
                  <div className="task-row-title">
                    {overdue && <span className="overdue-tag">⚠️ Overdue</span>}
                    {task.title}
                  </div>
                  <div className="task-row-meta">
                    <span>📁 {task.project?.name}</span>
                    {task.assignedTo && <span>👤 {task.assignedTo.name}</span>}
                    {task.dueDate && <span className={overdue ? 'overdue-text' : ''}>📅 {formatDate(task.dueDate)}</span>}
                  </div>
                </div>
                <div className="task-row-actions">
                  <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>{task.priority}</span>
                  <select
                    className="status-select"
                    value={task.status}
                    onChange={e => handleStatusChange(task._id, e.target.value)}
                  >
                    {['Todo', 'In Progress', 'Review', 'Done'].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task._id)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
