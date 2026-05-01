const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { requireAdmin, requireMember } = require('../middleware/role');

// @GET /api/projects — Get all projects the user is part of
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/projects — Create project
router.post(
  '/',
  protect,
  [
    body('name').trim().notEmpty().withMessage('Project name required'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { name, description, dueDate } = req.body;
      const project = await Project.create({
        name,
        description,
        dueDate,
        owner: req.user._id,
        members: [{ user: req.user._id, role: 'Admin' }],
      });
      await project.populate('owner', 'name email');
      res.status(201).json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// @GET /api/projects/:id — Get single project
router.get('/:projectId', protect, requireMember, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/projects/:id — Update project (Admin only)
router.put('/:projectId', protect, requireAdmin, async (req, res) => {
  try {
    const { name, description, status, dueDate } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      { name, description, status, dueDate },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email')
      .populate('members.user', 'name email');
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/projects/:id — Delete project (Owner/Admin only)
router.delete('/:projectId', protect, requireAdmin, async (req, res) => {
  try {
    await Task.deleteMany({ project: req.params.projectId });
    await Project.findByIdAndDelete(req.params.projectId);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/projects/:id/members — Add member (Admin only)
router.post('/:projectId/members', protect, requireAdmin, async (req, res) => {
  try {
    const { email, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const project = req.project;
    const alreadyMember = project.members.some((m) => m.user.toString() === user._id.toString());
    if (alreadyMember)
      return res.status(400).json({ success: false, message: 'User already a member' });

    project.members.push({ user: user._id, role: role || 'Member' });
    await project.save();
    await project.populate('members.user', 'name email');
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/projects/:id/members/:userId — Remove member (Admin only)
router.delete('/:projectId/members/:userId', protect, requireAdmin, async (req, res) => {
  try {
    const project = req.project;
    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove project owner' });
    }
    project.members = project.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await project.save();
    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/projects/:id/stats — Project stats
router.get('/:projectId/stats', protect, requireMember, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId });
    const now = new Date();
    const stats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'Todo').length,
      inProgress: tasks.filter((t) => t.status === 'In Progress').length,
      review: tasks.filter((t) => t.status === 'Review').length,
      done: tasks.filter((t) => t.status === 'Done').length,
      overdue: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done').length,
    };
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
