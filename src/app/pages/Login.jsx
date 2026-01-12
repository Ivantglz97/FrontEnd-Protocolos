import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthService, AlumnoService, DirectorService } from '../services/api';
import { toast } from 'sonner';
import { Lock, Mail, Loader2, Eye, EyeOff, Hexagon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

import fondoImagen from '../components/ui/FondoAzul.jpg';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Hacemos Login
      const response = await AuthService.login(formData);
      const user = response.data; 
      
      // Guardamos la sesión
      login(user);

      // ✅ 2. LOGICA PARA OBTENER EL NOMBRE REAL
      let nombreSaludo = user.email; // Valor por defecto por si falla

      try {
        if (user.rol === 'ROLE_USER') {
            // Si es alumno, buscamos sus datos
            const alumnoRes = await AlumnoService.getByIdUsuario(user.idUsuario);
            if (alumnoRes.data?.nombre) {
                nombreSaludo = alumnoRes.data.nombre; 
            }
        } else if (user.rol === 'ROLE_DIRECTOR') {
            // Si es director, buscamos sus datos
            const directorRes = await DirectorService.getByIdUsuario(user.idUsuario);
            if (directorRes.data?.nombre) {
                nombreSaludo = directorRes.data.nombre;
            }
        } else if (user.rol === 'ROLE_ADMIN') {
            nombreSaludo = "Administrador";
        }
      } catch (err) {
        console.warn("No se pudo cargar el nombre para el saludo, usando email.");
      }

      // ✅ 3. Mostramos el nombre real en el Toast
      toast.success(`Bienvenido, ${nombreSaludo}`);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error de login:', error);
      if (error.response && error.response.status === 401) {
        toast.error('Credenciales incorrectas.');
      } else {
        toast.error('Error de conexión o servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* CAPA DE FONDO */}
      <div className="absolute inset-0 z-0">
        <img 
            src={fondoImagen} 
            alt="Fondo Institucional" 
            className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#080F25]/90 mix-blend-multiply"></div>
      </div>

      <div className="absolute top-0 left-0 w-96 h-96 bg-[#6C72FF]/40 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 z-0"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#57C3FF]/30 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 z-0"></div>

      <div className="bg-[#101935]/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#212C4D] relative z-10">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-[#6C72FF]/10 p-3 rounded-xl border border-[#6C72FF]/20">
              <Hexagon className="w-8 h-8 text-[#6C72FF]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sistema de Gestión de Protocolos</h1>
          <p className="text-[#AEB9E1] mt-2 text-sm">Ingresa tus credenciales</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#AEB9E1]">Correo Electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-[#6C72FF]" />
              <Input
                id="email"
                type="email"
                placeholder="usuario@ipn.mx"
                className="pl-10 h-10 bg-[#080F25]/50 border-[#212C4D] text-white placeholder:text-[#37446B] focus:border-[#6C72FF] focus:ring-[#6C72FF]/20"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#AEB9E1]">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6C72FF]" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10 h-10 bg-[#080F25]/50 border-[#212C4D] text-white placeholder:text-[#37446B] focus:border-[#6C72FF] focus:ring-[#6C72FF]/20"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#AEB9E1] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-10 font-medium bg-[#6C72FF] hover:bg-[#585ed6] text-white border-none shadow-lg shadow-[#6C72FF]/20 transition-all" 
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Acceder al Sistema'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#212C4D] text-center">
          <p className="text-xs text-[#37446B]">
            &copy; {new Date().getFullYear()} Instituto Politécnico Nacional
          </p>
        </div>
      </div>
    </div>
  );
}