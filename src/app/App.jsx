import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';

//1. IMPORTAR EL COMPONENTE DE PROTECCIÓN QUE CREASTE
import { ProtectedRoute } from './components/ProtectedRoute'; 

// Importaciones de páginas
import { Dashboard } from './pages/Dashboard';
import { Alumnos } from './pages/Alumnos';
import { Usuarios } from './pages/Usuarios';
import { Directores } from './pages/Directores';
import { Departamentos } from './pages/Departamentos';
import { ProtocolosList } from './pages/ProtocolosList';
import { ProtocoloForm } from './pages/ProtocoloForm';
import { ProtocoloDetalle } from './pages/ProtocoloDetalle';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          
          {/* --- RUTA PÚBLICA --- */}
          <Route path="/login" element={<Login />} />

          {/* --- RUTAS PRIVADAS (Layout Principal) --- */}
          <Route
            path="/*"
            element={
              //  Nivel 1: Protección básica (Estar logueado para ver el Layout)
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    {/* Redirección inicial */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    {/* ACCESO GENERAL (Cualquier rol logueado) */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/alumnos" element={<Alumnos />} />
                    <Route path="/directores" element={<Directores />} />
                    <Route path="/protocolos" element={<ProtocolosList />} />
                    
                    {/* USUARIOS: SOLO ADMIN */}
                    <Route path="/usuarios" element={
                      <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                        <Usuarios />
                      </ProtectedRoute>
                    } />

                    {/* DEPARTAMENTOS: ADMIN y DIRECTOR (Alumnos no entran) */}
                    <Route path="/departamentos" element={
                      <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_DIRECTOR']}>
                        <Departamentos />
                      </ProtectedRoute>
                    } />

                    {/* CREAR/EDITAR PROTOCOLOS: ADMIN y DIRECTOR (Alumnos no entran) */}
                    <Route path="/protocolos/nuevo" element={
                      <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_DIRECTOR']}>
                        <ProtocoloForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/protocolos/editar/:id" element={
                      <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_DIRECTOR']}>
                        <ProtocoloForm />
                      </ProtectedRoute>
                    } />

                    {/* DETALLE PROTOCOLO: ACCESO GENERAL (Dentro se bloquean botones) */}
                    <Route path="/protocolos/:id" element={<ProtocoloDetalle />} />

                    {/* Ruta comodín */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}