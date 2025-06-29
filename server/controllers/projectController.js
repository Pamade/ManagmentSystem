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

    // Add projectId to user's projects array
    const db = getDatabase();
    await db.collection('users').updateOne(
      { _id: new ObjectId(ownerId) },
      { $addToSet: { projects: projectId } }
    );

    res.status(201).json({ message: 'Project created', projectId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const db = getDatabase();
    const projects = db.collection('projects');
    const userId = req.userId || null;
    const userObjectId = userId ? new ObjectId(userId) : null;

    const projectsList = await projects.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          as: 'ownerDetails'
        }
      },
      {
        $addFields: {
          owner: { $arrayElemAt: ['$ownerDetails', 0] },
          hasAccess: {
            $cond: {
              if: { $eq: [userObjectId, null] },
              then: false,
              else: {
                $or: [
                  { $eq: ['$ownerId', userObjectId] },
                  { $in: [userObjectId, { $ifNull: ['$participants', []] }] }
                ]
              }
            }
          },
          isOwner: {
            $cond: {
              if: { $eq: [userObjectId, null] },
              then: false,
              else: { $eq: ['$ownerId', userObjectId] }
            }
          },
          isParticipant: {
            $cond: {
              if: { $eq: [userObjectId, null] },
              then: false,
              else: { $in: [userObjectId, { $ifNull: ['$participants', []] }] }
            }
          }
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

    let userObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (e) {
      return res.status(403).json({ error: 'Access denied' });
    }

    
    const isOwner = project.ownerId && project.ownerId.equals(userObjectId);
    const isParticipant = (project.participants || []).some(pid => pid && pid.equals && pid.equals(userObjectId));
    const hasAccess = isOwner || isParticipant;
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    
    const enhancedProject = {
      ...project,
      hasAccess: true,
      isOwner,
      isParticipant
    };

    res.json(enhancedProject);
  } catch (error) {
    if (error.message && error.message.includes('ObjectId')) {
      return res.status(400).json({ error: 'Invalid project ID format' });
    }
    console.error('Error in getProjectById:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await Project.findById(new ObjectId(id));
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    let userObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (e) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!project.ownerId.equals(userObjectId)) {
      return res.status(403).json({ error: 'Only the project owner can update project details' });
    }

    const updateData = { ...req.body };
    delete updateData.ownerId;
    delete updateData.participants;
    delete updateData._id;

    try {
      const updated = await Project.update(new ObjectId(id), updateData);
      if (updated) {
        res.json({ message: 'Project updated successfully' });
      } else {
        res.status(400).json({ error: 'Failed to update project' });
      }
    } catch (err) {
      console.error('Error updating project:', err);
      res.status(500).json({ error: 'Failed to update project' });
    }
  } catch (error) {
    console.error('Error in updateProject:', error);
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
    const requestUserId = req.userId;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid project or user ID' });
    }

    const project = await Project.findById(new ObjectId(id));
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    let requestUserObjectId;
    try {
      requestUserObjectId = new ObjectId(requestUserId);
    } catch (e) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!project.ownerId.equals(requestUserObjectId)) {
      return res.status(403).json({ error: 'Only the project owner can update project details' });
    }

    try {
      await Project.addParticipant(new ObjectId(id), userId);
      res.json({ message: 'Participant added successfully' });
    } catch (error) {
      console.error('Error adding participant:', error);
      res.status(500).json({ error: 'Failed to add participant' });
    }
  } catch (error) {
    console.error('Error in addParticipant:', error);
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

    if (!project.ownerId.equals(userObjectId)) {
      return res.status(403).json({ error: 'Only the project owner can update project details' });
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
    console.log('Project ownerId:', project.ownerId, 'Request userId:', req.userId);
    if (!project.ownerId.equals(userObjectId)) {
      return res.status(403).json({ error: 'Only the project owner can update project details' });
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

    if (!project.ownerId.equals(userObjectId)) {
      return res.status(403).json({ error: 'Only the project owner can update project details' });
    }

    await Project.addInfo(new ObjectId(id), info);
    res.json({ message: 'Info added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add info' });
  }
};


exports.addProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progressText } = req.body;
    const userId = req.userId;

    if (!progressText || typeof progressText !== 'string') {
      return res.status(400).json({ error: 'Progress text is required' });
    }
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    try {
      const added = await Project.addProgress(id, userId, progressText);
      if (added) {
        res.json({ message: 'Progress added successfully' });
      } else {
        res.status(400).json({ error: 'Failed to add progress' });
      }
    } catch (err) {
      if (err.message === 'Access denied') {
        return res.status(403).json({ error: 'Only project owner or participant can add progress' });
      }
      res.status(500).json({ error: err.message || 'Failed to add progress' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to add progress' });
  }
};
