import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, isOverdue, getStatusBadgeClass, getPriorityBadgeClass } from '../utils/helpers';
import './DashboardPage.css';

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
    <div className="stat-icon">{icon}</div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard/summary')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const { summary, recentTasks, overdueTasks } = data || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👋 Hi, {user?.name?.split(' ')[0]}!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Here's what's happening with your projects</p>
        </div>
        <Link to="/projects" className="btn btn-primary">+ New Project</Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon="📁" label="Projects" value={summary?.projects || 0} color="#6366f1" />
        <StatCard icon="✅" label="Total Tasks" value={summary?.total || 0} color="#3b82f6" />
        <StatCard icon="🏃" label="In Progress" value={summary?.inProgress || 0} color="#f59e0b" />
        <StatCard icon="🎯" label="My Tasks" value={summary?.myTasks || 0} color="#10b981" />
        <StatCard icon="✔️" label="Completed" value={summary?.done || 0} color="#10b981" />
        <StatCard icon="⚠️" label="Overdue" value={summary?.overdue || 0} color="#ef4444" />
      </div>

      <div className="dashboard-grid">
        {/* Recent Tasks */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">Recent Tasks</h2>
            <Link to="/tasks" className="btn btn-secondary btn-sm">View all</Link>
          </div>
          {recentTasks?.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📝</div>
              <h3>No tasks yet</h3>
              <p>Create a project and add tasks to get started</p>
            </div>
          ) : (
            <div className="task-list">
              {recentTasks?.map(task => (
                <div key={task._id} className={`task-item ${isOverdue(task.dueDate, task.status) ? 'overdue' : ''}`}>
                  <div className="task-info">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className="project-name">📁 {task.project?.name}</span>
                      {task.dueDate && <span className="due-date">📅 {formatDate(task.dueDate)}</span>}
                    </div>
                  </div>
                  <div className="task-badges">
                    <span className={`badge ${getStatusBadgeClass(task.status)}`}>{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Tasks */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title" style={{ color: '#ef4444' }}>⚠️ Overdue Tasks</h2>
            <span className="badge" style={{ background: '#fef2f2', color: '#b91c1c' }}>{overdueTasks?.length || 0}</span>
          </div>
          {overdueTasks?.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🎉</div>
              <h3>All caught up!</h3>
              <p>No overdue tasks. Great job!</p>
            </div>
          ) : (
            <div className="task-list">
              {overdueTasks?.map(task => (
                <div key={task._id} className="task-item overdue">
                  <div className="task-info">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className="project-name">📁 {task.project?.name}</span>
                      <span className="due-date overdue-text">📅 {formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                  <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>{task.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
