const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

// Use optional auth for getting all projects
router.get('/', optionalAuthMiddleware, projectController.getAllProjects);

// Apply auth middleware to all other project routes
router.use(authMiddleware);

// Debug middleware
router.use((req, res, next) => {
  console.log('Project Route accessed:', req.method, req.path);
  next();
});

// Get single project
router.get('/:id', projectController.getProjectById);

// Create a new project
router.post('/', projectController.createProject);

// Update project
router.put('/:id', projectController.updateProject);

// Get project participants
router.get('/:id/participants', projectController.getProjectParticipants);

// Get available users to add
router.get('/:id/available-users', projectController.getAvailableUsers);

// Add participant to project
router.post('/:id/participants', projectController.addParticipant);

// Remove participant from project
router.delete('/:id/participants/:userId', projectController.removeParticipant);

// Update project status
router.patch('/:id/status', projectController.updateStatus);

// Add info to project
router.patch('/:id/info', projectController.addInfo);

module.exports = router;
