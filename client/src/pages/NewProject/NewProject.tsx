import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, MenuItem, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../../services/api';
import './NewProject.scss';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' }
];

const NewProject = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await projectApi.create({ name, description, status });
      setMessage('Project created successfully!');
      setOpen(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
      setOpen(true);
    }
  };

  return (
    <Paper className="new-project-paper" elevation={3}>
      <Typography variant="h5" gutterBottom>
        Add New Project
      </Typography>
      <form onSubmit={handleSubmit} className="new-project-form">
        <TextField
          label="Project Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          fullWidth
          margin="normal"
        />
        <TextField
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          multiline
          rows={3}
          fullWidth
          margin="normal"
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={e => setStatus(e.target.value)}
          fullWidth
          margin="normal"
        >
          {statusOptions.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Create Project
        </Button>
      </form>
      {(message || error) && (
        <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)}>
          {message ? (
            <Alert severity="success" sx={{ width: '100%' }}>{message}</Alert>
          ) : (
            <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>
          )}
        </Snackbar>
      )}
    </Paper>
  );
};

export default NewProject;
