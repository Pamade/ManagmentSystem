import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const name = localStorage.getItem('userName');
      setIsAuthenticated(!!token);
      setUserName(name || '');
    };

    checkAuth();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'userName') {
        checkAuth();
      }
    };

    const handleAuthEvent = () => checkAuth();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthEvent);
    };
  }, []);

  return { isAuthenticated, userName };
};
