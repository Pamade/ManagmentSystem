import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Chip, CircularProgress, Box, Divider } from '@mui/material';
import { Person as PersonIcon, Lock as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../services/api';
import './Home.scss';

interface Project {
  _id: string;
  name: string;
  status: string;
  hasAccess: boolean;
  isOwner: boolean;
}

interface ProjectGroup {
  ownerName: string;
  projects: Project[];
}

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myProjects, setMyProjects] = useState<ProjectGroup[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await projectApi.getAll();
        setMyProjects(data.myProjects || []);
        setAllProjects(data.allProjects || []);
        setError(null);
      } catch (err) {
        setError('Failed to load projects');
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const ProjectList = ({ groups, title }: { groups: ProjectGroup[], title: string }) => {
    console.log('Rendering ProjectList with groups:', groups);
    if (!groups || groups.length === 0) return null;

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
          {groups.map((group) => (
            <Card key={group.ownerName} className="owner-card" elevation={2}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <PersonIcon sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h3">
                    {group.ownerName || 'Unknown Owner'}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {group.projects.map((project) => (
                    <Box 
                      key={project._id}
                      onClick={() => project.hasAccess && navigate(`/project/${project._id}`)}
                      sx={{ 
                        p: 2,
                        borderRadius: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.03)',
                        transition: 'all 0.2s ease',
                        cursor: project.hasAccess ? 'pointer' : 'not-allowed',
                        '&:hover': {
                          backgroundColor: project.hasAccess ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.03)',
                          transform: project.hasAccess ? 'translateY(-2px)' : 'none',
                          boxShadow: project.hasAccess ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                        }
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {project.name}
                        </Typography>
                        {!project.hasAccess && (
                          <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        )}
                      </Box>
                      <Box display="flex" gap={1} mt={1}>
                        <Chip 
                          label={project.status} 
                          color={project.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                        {project.isOwner && (
                          <Chip 
                            label="Owner"
                            color="primary"
                            size="small"
                          />
                        )}
                        {project.hasAccess && !project.isOwner && (
                          <Chip 
                            label="Participant"
                            color="info"
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {allProjects.length === 0 && (
        <Typography variant="h6" align="center" sx={{ mt: 3 }}>
          No projects found. Create account and start adding projects.  
        </Typography>
      )}
      <ProjectList groups={myProjects} title="My Projects" />
      <ProjectList groups={allProjects} title="Other Projects" />
    </Box>
  );
};

export default Home;