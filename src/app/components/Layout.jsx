import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, FileText, Users, UserCog, Building2, 
  Menu, X, LogOut, ShieldCheck, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 

export function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Estado para el menú MÓVIL (Abrir/Cerrar completo)
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Estado para el menú ESCRITORIO (Colapsar ancho)
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'protocolos', label: 'Protocolos', icon: FileText, path: '/protocolos' },
    { id: 'alumnos', label: 'Alumnos', icon: Users, path: '/alumnos' },
    { id: 'usuarios', label: 'Usuarios', icon: ShieldCheck, path: '/usuarios' },
    { id: 'directores', label: 'Directores', icon: UserCog, path: '/directores' },
    { id: 'departamentos', label: 'Departamentos', icon: Building2, path: '/departamentos' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    // CONTENEDOR PRINCIPAL
    <div className="flex h-screen w-full bg-[#080F25] text-[#AEB9E1] overflow-hidden relative">
      
      {/* 1. OVERLAY OSCURO (Solo visible en móvil cuando el menú está abierto) */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 2. SIDEBAR 
         - fixed/z-50 en móvil para flotar.
         - static en escritorio para empujar.
      */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 
          flex flex-col bg-[#101935] border-r border-[#212C4D] shadow-2xl
          transition-all duration-300 ease-in-out
          
          /* Lógica Móvil: Entra y sale de la pantalla */
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          
          /* Lógica Escritorio: Siempre visible y estático */
          lg:translate-x-0 lg:static
          
          /* Ancho: Fijo en móvil, dinámico en escritorio */
          w-64 
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        <div className="h-full flex flex-col">
          
          {/* Header del Sidebar */}
          <div className="p-5 border-b border-[#212C4D] flex items-center justify-between h-16">
            {/* Título (Solo si no está colapsado o si estamos en móvil) */}
            {(!isCollapsed || isMobileOpen) ? (
              <h1 className="font-bold text-lg text-white tracking-wide truncate">
                Gestión <span className="text-[#6C72FF]">IPN</span>
              </h1>
            ) : (
              <span className="mx-auto font-bold text-[#6C72FF]">IPN</span>
            )}

            {/* Botón cerrar (Solo móvil) */}
            <button 
                onClick={() => setIsMobileOpen(false)} 
                className="lg:hidden p-1 rounded-md text-[#AEB9E1] hover:text-white hover:bg-[#212C4D]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              if (item.id === 'usuarios' && user?.rol !== 'ROLE_ADMIN') return null;
              if (item.id === 'departamentos' && user?.rol === 'ROLE_USER') return null;

              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileOpen(false); // Cerrar al hacer clic en móvil
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium ${
                    isActive 
                      ? 'bg-[#6C72FF] text-white shadow-lg shadow-[#6C72FF]/20' 
                      : 'text-[#AEB9E1] hover:bg-[#212C4D] hover:text-white'
                  } ${isCollapsed ? 'justify-center lg:px-0' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#57C3FF]'}`} />
                  {/* Texto: Visible si NO está colapsado O si estamos en móvil */}
                  {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer del Sidebar (Usuario) */}
          <div className="p-4 border-t border-[#212C4D] bg-[#0D152E]">
            {user && (
              <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
                {/* Avatar / Inicial */}
                <div className="w-8 h-8 rounded-full bg-[#212C4D] flex items-center justify-center text-[#57C3FF] border border-[#57C3FF]/30 shrink-0">
                    <span className="font-bold text-xs">{user.email?.charAt(0).toUpperCase()}</span>
                </div>
                
                {/* Info Usuario (Oculta si colapsado) */}
                {(!isCollapsed || isMobileOpen) && (
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate w-32" title={user.email}>{user.email}</p>
                        <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#212C4D] text-[#57C3FF]">
                          {user.rol?.replace('ROLE_', '')}
                        </span>
                    </div>
                )}
              </div>
            )}

            <button 
                onClick={handleLogout} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-sm font-medium border border-transparent hover:border-rose-500/20 ${isCollapsed ? 'justify-center' : ''}`}
                title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span>Salir</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* 3. CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        
        {/* Header Superior */}
        <header className="bg-[#101935] border-b border-[#212C4D] px-6 py-3 flex items-center justify-between shadow-md z-10 h-16 shrink-0">
          
          <div className="flex items-center gap-3">
            {/* Botón Hamburguesa (MÓVIL) - Abre el sidebar */}
            <button 
                onClick={() => setIsMobileOpen(true)} 
                className="p-2 rounded-lg text-[#AEB9E1] hover:bg-[#212C4D] hover:text-white lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Botón Colapsar (ESCRITORIO) */}
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-2 rounded-lg text-[#AEB9E1] hover:bg-[#212C4D] hover:text-white transition-colors"
            >
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

            {/* Fecha o Título (Visible siempre) */}
            <div className="text-sm font-medium text-[#AEB9E1] hidden sm:block">
               {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <div className="lg:hidden font-bold text-white">
            IPN <span className="text-[#6C72FF]">Gestión</span>
          </div>
        </header>

        {/* Área de Scroll */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080F25] scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}