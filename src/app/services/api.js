import axios from 'axios';

// 1. Configuración de la URL Base
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// --- 2. INTERCEPTORES ---

// Interceptor de Peticiones: Adjunta el Token JWT
api.interceptors.request.use((config) => {
    const user = JSON.parse(sessionStorage.getItem('usuario_ipn'));
    if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor de Respuestas: Manejo de Sesión Expirada (401)
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            sessionStorage.removeItem('usuario_ipn');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// --- 3. DEFINICIÓN DE SERVICIOS ---

const AuthService = {
    login: (credenciales) => api.post('/auth/login', credenciales),
};

const UsuarioService = {
    getAll: () => api.get('/usuarios'),
    getById: (id) => api.get(`/usuarios/${id}`),
    create: (data) => api.post('/usuarios', data),
    update: (id, data) => api.put(`/usuarios/${id}`, data),
    delete: (id) => api.delete(`/usuarios/${id}`),
};

const ProtocoloService = {
    getAll: () => api.get('/protocolos'),
    getById: (id) => api.get(`/protocolos/${id}`),
    create: (data) => api.post('/protocolos', data), // Recibe ProtocoloRequestDTO
    update: (id, data) => api.put(`/protocolos/${id}`, data),
    delete: (id) => api.delete(`/protocolos/${id}`),
};

const AlumnoService = {
    getAll: () => api.get('/alumnos'),
    getById: (id) => api.get(`/alumnos/${id}`),
    getByIdUsuario: (idUsuario) => api.get(`/alumnos/usuario/${idUsuario}`), // 
    create: (data) => api.post('/alumnos', data),
    update: (id, data) => api.put(`/alumnos/${id}`, data),
    delete: (id) => api.delete(`/alumnos/${id}`),
};

const DirectorService = {
    getAll: () => api.get('/directores'),
    getById: (id) => api.get(`/directores/${id}`),
    getByIdUsuario: (idUsuario) => api.get(`/directores/usuario/${idUsuario}`), // 
    create: (data) => api.post('/directores', data),
    update: (id, data) => api.put(`/directores/${id}`, data),
    delete: (id) => api.delete(`/directores/${id}`),
};

const AdministradorService = {
    getAll: () => api.get('/administradores'),
    getById: (id) => api.get(`/administradores/${id}`),
    create: (data) => api.post('/administradores', data),
    update: (id, data) => api.put(`/administradores/${id}`, data),
    delete: (id) => api.delete(`/administradores/${id}`),
};

const AsignacionService = {
    getAll: () => api.get('/asignaciones'),
    getById: (id) => api.get(`/asignaciones/${id}`),
    create: (data) => api.post('/asignaciones', data),
    update: (id, data) => api.put(`/asignaciones/${id}`, data),
    delete: (id) => api.delete(`/asignaciones/${id}`),
};

const DepartamentoService = {
    getAll: () => api.get('/departamentos'),
    getById: (id) => api.get(`/departamentos/${id}`),
    create: (data) => api.post('/departamentos', data),
    update: (id, data) => api.put(`/departamentos/${id}`, data),
    delete: (id) => api.delete(`/departamentos/${id}`),
};

const ProtocoloDirectorService = {
    getByProtocoloId: (id) => api.get(`/protocolo-director/protocolo/${id}`),
    create: (data) => api.post('/protocolo-director', data),
    delete: (idRegistro) => api.delete(`/protocolo-director/${idRegistro}`)
};

const ReporteService = {
    descargarPdf: (id) => api.get(`/reportes/descargar-protocolo/${id}`, { responseType: 'blob' }),
    enviarEmail: (data) => api.post('/reportes/enviar-protocolo', data),
};

// --- 4. EXPORTACIONES ---
export {
    api,
    AuthService,
    UsuarioService,
    ProtocoloService,
    AlumnoService,
    AdministradorService,
    AsignacionService,
    DepartamentoService,
    DirectorService,
    ProtocoloDirectorService,
    ReporteService
};

export default api;