const Project = require('../models/Project');
const { ObjectId } = require('mongodb');
const { getDatabase } = require('../database');

exports.createProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const ownerId = req.userId;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = new Project(name, description, status, ownerId);
    const projectId = await project.create();
    res.status(201).json({ message: 'Project created', projectId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const db = getDatabase();
    const projects = db.collection('projects');
    const userId = req.userId;

    const projectsList = await projects.aggregate([
      {
        $lookup: {
          from: 'users',
          let: { owner_id: { $toObjectId: '$ownerId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$owner_id'] } } },
            { $project: { name: 1, _id: 0 } }
          ],
          as: 'ownerDetails'
        }
      },
      {
        $addFields: {
          owner: { $arrayElemAt: ['$ownerDetails', 0] },
          hasAccess: {
            $or: [
              { $eq: ['$ownerId', userId] },
              { $in: [userId, { $ifNull: ['$participants', []] }] }
            ]
          },
          isOwner: { $eq: ['$ownerId', userId] },
          isParticipant: { $in: [userId, { $ifNull: ['$participants', []] }] }
        }
      },
      {
        $project: {
          ownerDetails: 0
        }
      },
      {
        $facet: {
          myProjects: [
            { $match: { hasAccess: true } },
            {
              $group: {
                _id: '$owner.name',
                projects: {
                  $push: {
                    _id: '$_id',
                    name: '$name',
                    description: '$description',
                    status: '$status',
                    hasAccess: '$hasAccess',
                    isOwner: '$isOwner',
                    isParticipant: '$isParticipant'
                  }
                }
              }
            },
            {
              $project: {
                _id: 0,
                ownerName: '$_id',
                projects: 1
              }
            }
          ],
          allProjects: [
            { $match: { hasAccess: false } },
            {
              $group: {
                _id: '$owner.name',
                projects: {
                  $push: {
                    _id: '$_id',
                    name: '$name',
                    description: '$description',
                    status: '$status',
                    hasAccess: '$hasAccess',
                    isOwner: '$isOwner',
                    isParticipant: '$isParticipant'
                  }
                }
              }
            },
            {
              $project: {
                _id: 0,
                ownerName: '$_id',
                projects: 1
              }
            }
          ]
        }
      }
    ]).toArray();

    res.json({
      myProjects: projectsList[0].myProjects,
      allProjects: projectsList[0].allProjects
    });
  } catch (error) {
    console.error('Error in getAllProjects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.userId;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const db = getDatabase();
    const projects = db.collection('projects');

    const project = await projects.findOne({ 
      _id: new ObjectId(projectId)
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user has access (owner or participant)
    const hasAccess = project.ownerId === userId || (project.participants || []).includes(userId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Enhance project with access information
    const enhancedProject = {
      ...project,
      hasAccess: true,
      isOwner: project.ownerId === userId,
      isParticipant: (project.participants || []).includes(userId)
    };

    res.json(enhancedProject);
  } catch (error) {
    if (error.message.includes('ObjectId')) {
      return res.status(400).json({ error: 'Invalid project ID format' });
    }
    console.error('Error in getProjectById:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await Project.findById(new ObjectId(id));
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only the project owner can update project details' });
    }

    const updateData = { ...req.body };
    delete updateData.ownerId;
    delete updateData.participants;
    delete updateData._id;

    const updated = await Project.update(new ObjectId(id), updateData);
    if (updated) {
      res.json({ message: 'Project updated successfully' });
    } else {
      res.status(400).json({ error: 'Failed to update project' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
};

exports.getProjectParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await Project.findById(new ObjectId(id));
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const participants = await Project.getParticipants(new ObjectId(id));
    res.json(participants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
};

exports.getAvailableUsers = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const availableUsers = await Project.getAvailableUsers(new ObjectId(id));
    res.json(availableUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available users' });
  }
};

exports.addParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await Project.findById(new ObjectId(id));
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only the project owner can add participants' });
    }

    await Project.addParticipant(new ObjectId(id), userId);
    res.json({ message: 'Participant added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add participant' });
  }
};

exports.removeParticipant = async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await Project.findById(new ObjectId(id));
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only the project owner can remove participants' });
    }

    await Project.removeParticipant(new ObjectId(id), userId);
    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove participant' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await Project.findById(new ObjectId(id));
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only the project owner can update status' });
    }

    await Project.updateStatus(new ObjectId(id), status);
    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

exports.addInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { info } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await Project.findById(new ObjectId(id));
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only the project owner can update info' });
    }

    await Project.addInfo(new ObjectId(id), info);
    res.json({ message: 'Info added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add info' });
  }
};
