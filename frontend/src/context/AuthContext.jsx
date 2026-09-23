import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

function readStoredSession() {
  const token = localStorage.getItem('token');
  const serializedUser = localStorage.getItem('user');

  if (!token || !serializedUser) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { token: null, user: null };
  }

  try {
    const user = JSON.parse(serializedUser);
    if (!user || typeof user.email !== 'string') {
      throw new Error('Usuario almacenado inválido.');
    }
    return { token, user };
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

  const login = (userData, authToken) => {
    setSession({ user: userData, token: authToken });
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setSession({ user: null, token: null });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{
      user: session.user,
      token: session.token,
      isAuthenticated: Boolean(session.token && session.user),
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
