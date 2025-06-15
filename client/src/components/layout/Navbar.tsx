import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Add as AddIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.scss';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userName } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.dispatchEvent(new Event('authStateChanged'));
    navigate('/auth');
  };

  return (
    <AppBar position="static" className="navbar">
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Project Management
        </Typography>

        {isAuthenticated ? (
          <>
            <Typography sx={{ mr: 2 }}>
              {userName}
            </Typography>
            <Button 
              color="inherit" 
              startIcon={<AddIcon />}
              onClick={() => navigate('/projects/new')}
            >
              New Project
            </Button>
            <Button 
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </>
        ) : (
          <Button 
            color="inherit"
            onClick={() => navigate('/auth')}
          >
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;