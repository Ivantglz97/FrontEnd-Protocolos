import { createContext, useContext, useState } from 'react';

// 1. Creamos el contexto
const AuthContext = createContext();

// 2. Creamos el Proveedor
export function AuthProvider({ children }) {
  
  // Estado del usuario: Al iniciar, intentamos leer si hay sesión en la pestaña actual
  const [user, setUser] = useState(() => {
    try {
      // Usamos sessionStorage en lugar de localStorage
      const savedUser = sessionStorage.getItem('usuario_ipn');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Error al leer sesión:", error);
      return null;
    }
  });

  // Función para Iniciar Sesión
  const login = (userData) => {
    setUser(userData);
    //Guardamos en sessionStorage (se borra al cerrar el navegador)
    sessionStorage.setItem('usuario_ipn', JSON.stringify(userData));
  };

  // Función para Cerrar Sesión
  const logout = () => {
    setUser(null);
    //Limpiamos sessionStorage
    sessionStorage.removeItem('usuario_ipn');
  };

  // Valores que compartiremos con toda la app
  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};