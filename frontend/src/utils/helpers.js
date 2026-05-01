import { format, isAfter, isPast } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'Done') return false;
  return isPast(new Date(dueDate));
};

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getStatusBadgeClass = (status) => {
  const map = {
    'Todo': 'badge-todo',
    'In Progress': 'badge-inprogress',
    'Review': 'badge-review',
    'Done': 'badge-done',
  };
  return map[status] || 'badge-todo';
};

export const getPriorityBadgeClass = (priority) => {
  const map = {
    'Low': 'badge-low',
    'Medium': 'badge-medium',
    'High': 'badge-high',
    'Critical': 'badge-critical',
  };
  return map[priority] || 'badge-medium';
};

export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.errors) return error.response.data.errors[0]?.msg || 'Validation error';
  return error.message || 'Something went wrong';
};
