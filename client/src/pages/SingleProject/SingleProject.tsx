import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { projectApi } from '../../services/api';
import './SingleProject.scss';

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  ownerId: string;
  participants: string[];
  info: Record<string, any>;
  created_at: string;
  hasAccess: boolean;
  isOwner: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Participant extends User {
  isOwner: boolean;
}

const SingleProject = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Partial<Project>>({});
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchProjectData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError('');

      // Fetch project details
      const projectData = await projectApi.getById(id);
      setProject(projectData);
      setEditedProject(projectData);

      if (!projectData.hasAccess) {
        setError('You do not have access to this project');
        return;
      }

      // Fetch participants
      const { participants: participantsData } = await projectApi.getParticipants(id);
      setParticipants(participantsData);

      // Only fetch available users if user is the owner
      if (projectData.isOwner) {
        const { availableUsers: availableUsersData } = await projectApi.getAvailableUsers(id);
        setAvailableUsers(availableUsersData);
      }

    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError(err.response?.data?.error || 'Failed to fetch project data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setError('');
      await projectApi.update(id!, { status: newStatus });
      setProject(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleSaveChanges = async () => {
    try {
      setError('');
      await projectApi.update(id!, editedProject);
      setProject(prev => prev ? { ...prev, ...editedProject } : null);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update project');
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedUserId) return;
    
    try {
      setError('');
      await projectApi.addParticipant(id!, selectedUserId);
      setAddUserDialogOpen(false);
      setSelectedUserId('');
      await fetchProjectData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add participant');
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    try {
      setError('');
      await projectApi.removeParticipant(id!, userId);
      await fetchProjectData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove participant');
    }
  };

  if (loading) {
    return (
      <Container className="single-project">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!project) {
    return (
      <Container className="single-project">
        <Alert severity="error">Project not found</Alert>
      </Container>
    );
  }

  if (!project.hasAccess) {
    return (
      <Container className="single-project">
        <Alert severity="error">You do not have access to this project</Alert>
      </Container>
    );
  }

  return (
    <Container className="single-project">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper elevation={3} className="project-paper">
        {isEditing ? (
          <Box className="edit-form">
            <TextField
              fullWidth
              label="Project Name"
              value={editedProject.name || ''}
              onChange={(e) => setEditedProject(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={editedProject.description || ''}
              onChange={(e) => setEditedProject(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
            />
            <Box className="action-buttons">
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveChanges}
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setIsEditing(false);
                  setEditedProject(project);
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Box className="project-header">
              <Box>
                <Typography variant="h4" component="h1">{project.name}</Typography>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  {project.description}
                </Typography>
              </Box>
              {project.isOwner && (
                <IconButton onClick={() => setIsEditing(true)} color="primary">
                  <EditIcon />
                </IconButton>
              )}
            </Box>

            <Box className="project-status" sx={{ my: 3 }}>
              <FormControl>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={project.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={!project.isOwner}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box className="participants-section">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Participants</Typography>
                {project.isOwner && (
                  <Button
                    startIcon={<PersonAddIcon />}
                    onClick={() => setAddUserDialogOpen(true)}
                    variant="outlined"
                  >
                    Add Participant
                  </Button>
                )}
              </Box>

              {participants.length > 0 ? (
                <List>
                  {participants.map((participant) => (
                    <ListItem key={participant._id}>
                      <ListItemText
                        primary={participant.name}
                        secondary={
                          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {participant.email}
                            <Chip 
                              size="small" 
                              label={participant.isOwner ? "Owner" : "Participant"}
                              color={participant.isOwner ? "primary" : "default"}
                              component="span"
                            />
                          </span>
                        }
                      />
                      {project.isOwner && !participant.isOwner && (
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveParticipant(participant._id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary">No participants added yet.</Typography>
              )}
            </Box>

            <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)}>
              <DialogTitle>Add Participant</DialogTitle>
              <DialogContent>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Select User</InputLabel>
                  <Select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    fullWidth
                  >
                    {availableUsers.map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => {
                  setAddUserDialogOpen(false);
                  setSelectedUserId('');
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddParticipant} 
                  color="primary" 
                  disabled={!selectedUserId}
                  variant="contained"
                >
                  Add
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default SingleProject;
