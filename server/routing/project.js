const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
router.get('/', optionalAuthMiddleware, projectController.getAllProjects);
router.use(authMiddleware);


router.use((req, res, next) => {
  console.log('Project Route accessed:', req.method, req.path);
  next();
});
router.get('/:id', projectController.getProjectById);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.get('/:id/participants', projectController.getProjectParticipants);
router.get('/:id/available-users', projectController.getAvailableUsers);
router.post('/:id/participants', projectController.addParticipant);
router.delete('/:id/participants/:userId', projectController.removeParticipant);
router.patch('/:id/status', projectController.updateStatus);
router.patch('/:id/info', projectController.addInfo);

module.exports = router;
