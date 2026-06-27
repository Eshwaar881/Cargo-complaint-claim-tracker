import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = "loading"
  const [role, setRole] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('cargo_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setRole(parsed.role);
      } catch (e) {
        localStorage.removeItem('cargo_user');
        setUser(null);
        setRole(null);
      }
    } else {
      setUser(null);
      setRole(null);
    }
  }, []);

  const login = (userData) => {
    localStorage.setItem('cargo_user', JSON.stringify(userData));
    setUser(userData);
    setRole(userData.role);
  };

  const logout = () => {
    localStorage.removeItem('cargo_user');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading: user === undefined, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
