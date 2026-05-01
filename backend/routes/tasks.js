const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// Helper: check if user is member of the task's project
const checkProjectMembership = async (userId, projectId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some((m) => m.user.toString() === userId.toString());
  return isOwner || isMember ? project : null;
};

const isProjectAdmin = (project, userId) => {
  if (project.owner.toString() === userId.toString()) return true;
  const member = project.members.find((m) => m.user.toString() === userId.toString());
  return member && member.role === 'Admin';
};

// @GET /api/tasks?project=id — Get tasks (optionally filter by project)
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    // Only tasks in projects the user belongs to
    const userProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).select('_id');
    const projectIds = userProjects.map((p) => p._id);
    filter.project = filter.project
      ? [filter.project].filter((id) => projectIds.map(String).includes(String(id)))
      : { $in: projectIds };

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/tasks — Create task
router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('project').notEmpty().withMessage('Project is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { title, description, project, assignedTo, status, priority, dueDate, tags } = req.body;
      const proj = await checkProjectMembership(req.user._id, project);
      if (!proj) return res.status(403).json({ success: false, message: 'Access denied to project' });

      const task = await Task.create({
        title, description, project, assignedTo: assignedTo || null,
        createdBy: req.user._id, status, priority, dueDate, tags,
      });
      await task.populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'createdBy', select: 'name email' },
        { path: 'project', select: 'name' },
      ]);
      res.status(201).json({ success: true, task });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// @GET /api/tasks/:id — Get single task
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name owner members');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const proj = await checkProjectMembership(req.user._id, task.project._id);
    if (!proj) return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/tasks/:id — Update task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const proj = await checkProjectMembership(req.user._id, task.project._id);
    if (!proj) return res.status(403).json({ success: false, message: 'Access denied' });

    const { title, description, assignedTo, status, priority, dueDate, tags } = req.body;
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, assignedTo, status, priority, dueDate, tags },
      { new: true, runValidators: true }
    ).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'project', select: 'name' },
    ]);

    res.json({ success: true, task: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/tasks/:id — Delete task (Admin or creator)
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const project = await Project.findById(task.project);
    const admin = isProjectAdmin(project, req.user._id);
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!admin && !isCreator) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/tasks/dashboard/summary — Dashboard summary for logged-in user
router.get('/dashboard/summary', protect, async (req, res) => {
  try {
    const userProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).select('_id');
    const projectIds = userProjects.map((p) => p._id);

    const now = new Date();
    const [total, myTasks, overdue, done, inProgress] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, assignedTo: req.user._id }),
      Task.countDocuments({ project: { $in: projectIds }, dueDate: { $lt: now }, status: { $ne: 'Done' } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'Done' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'In Progress' }),
    ]);

    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('assignedTo', 'name')
      .populate('project', 'name');

    const overdueTasks = await Task.find({
      project: { $in: projectIds },
      dueDate: { $lt: now },
      status: { $ne: 'Done' },
    })
      .limit(5)
      .populate('assignedTo', 'name')
      .populate('project', 'name');

    res.json({
      success: true,
      summary: { total, myTasks, overdue, done, inProgress, projects: userProjects.length },
      recentTasks,
      overdueTasks,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
