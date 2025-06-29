const { getDatabase } = require('../database');
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = 'projects';

class Project {
  constructor(name, description, status, ownerId, info) {
    this.name = name;
    this.description = description || '';
    this.status = status || 'pending';
    this.ownerId = ownerId;
    this.info = info || {};
    this.participants = []; // Initialize empty participants array
  }

  async create() {
    const db = getDatabase();
    const projects = db.collection(COLLECTION_NAME);
    const ownerObjectId = typeof this.ownerId === 'string' ? new ObjectId(this.ownerId) : this.ownerId;
    const result = await projects.insertOne({
      name: this.name,
      description: this.description,
      status: this.status,
      ownerId: ownerObjectId,
      info: this.info,
      participants: [], // Do NOT add owner as participant
      created_at: new Date()
    });
    return result.insertedId;
  }

  static async findById(id) {
    const db = getDatabase();
    const projects = db.collection(COLLECTION_NAME);
    return await projects.findOne({ _id: id });
  }

  static async updateStatus(projectId, newStatus) {
    const db = getDatabase();
    const projects = db.collection(COLLECTION_NAME);
    const result = await projects.updateOne(
      { _id: projectId },
      { $set: { status: newStatus, updated_at: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  static async addParticipant(projectId, userId) {
    const db = getDatabase();
    const projects = db.collection(COLLECTION_NAME);
    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    if (!project) throw new Error('Project not found');
    // Prevent adding owner as participant
    if (project.ownerId.equals(new ObjectId(userId))) {
      throw new Error('Owner cannot be a participant');
    }
    const result = await projects.updateOne(
      { _id: new ObjectId(projectId) },
      {
        $addToSet: { participants: new ObjectId(userId) },
        $set: { updated_at: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  static async removeParticipant(projectId, userId) {
    const db = getDatabase();
    const projects = db.collection(COLLECTION_NAME);
    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    if (!project) throw new Error('Project not found');
    // Prevent removing owner from participants (should never be there)
    if (project.ownerId.equals(new ObjectId(userId))) {
      throw new Error('Cannot remove owner from participants');
    }
    const result = await projects.updateOne(
      { _id: new ObjectId(projectId) },
      {
        $pull: { participants: new ObjectId(userId) },
        $set: { updated_at: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  static async update(id, updateData) {
    const db = getDatabase();
    const projects = db.collection(COLLECTION_NAME);
    const result = await projects.updateOne(
      { _id: id },
      { 
        $set: { 
          ...updateData,
          updated_at: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  }

  static async addInfo(projectId, info) {
    const db = getDatabase();
    const projects = db.collection(COLLECTION_NAME);
    const result = await projects.updateOne(
      { _id: projectId },
      { 
        $set: { 
          info,
          updated_at: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  }

  static async getParticipants(projectId) {
    const db = getDatabase();
    const projects = db.collection(COLLECTION_NAME);
    const users = db.collection('users');

    const project = await projects.findOne({ _id: projectId });
    if (!project) {
      throw new Error('Project not found');
    }

    const participantIds = project.participants || [];
    const participantsData = await users.find({
      _id: { $in: participantIds.map(id => new ObjectId(id)) }
    }).toArray();

    // Map participants and mark the owner
    return {
      participants: participantsData.map(user => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        isOwner: user._id.toString() === project.ownerId
      }))
    };
  }

  static async getAvailableUsers(projectId) {
    const db = getDatabase();
    const projects = db.collection(COLLECTION_NAME);
    const users = db.collection('users');

    const project = await projects.findOne({ _id: projectId });
    if (!project) {
      throw new Error('Project not found');
    }

    const participantIds = project.participants || [];
    // Exclude owner from available users
    const excludeIds = [project.ownerId, ...participantIds];
    const availableUsers = await users.find({
      _id: { $nin: excludeIds }
    }).toArray();

    return {
      availableUsers: availableUsers.map(user => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email
      }))
    };
  }

  static async hasAccess(projectId, userId) {
    try {
      const db = getDatabase();
      const projects = db.collection(COLLECTION_NAME);
      
      const project = await projects.findOne({ _id: new ObjectId(projectId) });
      if (!project) return false;
      
      return project.ownerId === userId || (project.participants || []).includes(userId);
    } catch (error) {
      return false;
    }
  }
}

module.exports = Project;