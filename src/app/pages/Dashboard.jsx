import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Users, UserCog, Building2, TrendingUp, 
  User, Mail, Phone, Hash, GraduationCap, Briefcase,
  ChevronRight, Calendar
} from 'lucide-react';

import { Button } from '../components/ui/button'; 
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  ProtocoloService, AlumnoService, 
  DirectorService, DepartamentoService 
} from '../services/api';

export function Dashboard() {
  const navigate = useNavigate();
  const session = JSON.parse(sessionStorage.getItem('usuario_ipn'));
  const userRole = session?.rol;
  const userId = session?.idUsuario;

  const [stats, setStats] = useState({ protocolos: 0, alumnos: 0, directores: 0, departamentos: 0 });
  const [profile, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [protRes, alumRes, dirRes, deptRes] = await Promise.all([
        ProtocoloService.getAll(), AlumnoService.getAll(), DirectorService.getAll(), DepartamentoService.getAll()
      ]);

      const allProtocolos = protRes.data || [];
      const allAlumnos = alumRes.data || [];
      const allDirectores = dirRes.data || [];
      const allDepartamentos = deptRes.data || [];

      let misProtocolos = allProtocolos;
      let misAlumnos = allAlumnos;
      let misDirectores = allDirectores;
      let misDepartamentos = allDepartamentos;

      if (userRole !== 'ROLE_ADMIN') {
        misProtocolos = allProtocolos.filter(p => {
            const soyAlumno = [p.alumno1, p.alumno2, p.alumno3, p.alumno4].some(a => a?.usuario?.idUsuario === userId);
            const soyDirector = p.directoresAsignados?.some(d => d.director.usuario?.idUsuario === userId);
            return soyAlumno || soyDirector;
        });
        const boletasVisibles = new Set();
        misProtocolos.forEach(p => { [p.alumno1, p.alumno2, p.alumno3, p.alumno4].forEach(a => { if(a) boletasVisibles.add(a.numeroBoleta); }); });
        if(userRole === 'ROLE_USER') { const miPerfil = allAlumnos.find(a => a.usuario?.idUsuario === userId); if(miPerfil) boletasVisibles.add(miPerfil.numeroBoleta); }
        misAlumnos = allAlumnos.filter(a => boletasVisibles.has(a.numeroBoleta));

        const directoresVisibles = new Set();
        misProtocolos.forEach(p => { p.directoresAsignados?.forEach(rel => { if(rel.director) directoresVisibles.add(rel.director.numeroTrabajador); }); });
        if(userRole === 'ROLE_DIRECTOR') { const miPerfil = allDirectores.find(d => d.usuario?.idUsuario === userId); if(miPerfil) directoresVisibles.add(miPerfil.numeroTrabajador); }
        misDirectores = allDirectores.filter(d => directoresVisibles.has(d.numeroTrabajador));

        if (userRole === 'ROLE_DIRECTOR') {
             const miPerfil = allDirectores.find(d => d.usuario?.idUsuario === userId);
             const miDeptoId = miPerfil?.departamento?.idDepartamento;
             misDepartamentos = miDeptoId ? allDepartamentos.filter(d => d.idDepartamento === miDeptoId) : [];
        } else if (userRole === 'ROLE_USER') { misDepartamentos = []; }
      }

      setStats({ protocolos: misProtocolos.length, alumnos: misAlumnos.length, directores: misDirectores.length, departamentos: misDepartamentos.length });

      if (userRole === 'ROLE_USER') {
        const profileRes = await AlumnoService.getByIdUsuario(userId); setPerfil(profileRes.data);
      } else if (userRole === 'ROLE_DIRECTOR') {
        const profileRes = await DirectorService.getByIdUsuario(userId); setPerfil(profileRes.data);
      } else {
        setPerfil({ nombre: 'Administrador', apellidoPaterno: 'Sistema', cargo: 'Gestión Total', numeroTrabajador: 'ADM-ROOT', escuelaPerteneciente: 'ESCOM - IPN', numeroTelefonico: '55-5729-6000' });
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const statCards = [
    { title: userRole === 'ROLE_DIRECTOR' ? 'Mis Protocolos' : 'Protocolos', value: stats.protocolos, icon: FileText, color: 'text-indigo-600', bgColor: 'bg-indigo-50', path: '/protocolos' },
    { title: userRole === 'ROLE_DIRECTOR' ? 'Mis Alumnos' : 'Alumnos', value: stats.alumnos, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50', path: '/alumnos' },
    { title: userRole === 'ROLE_DIRECTOR' ? 'Colegas' : 'Directores', value: stats.directores, icon: UserCog, color: 'text-violet-600', bgColor: 'bg-violet-50', path: '/directores' },
    ...(userRole !== 'ROLE_USER' ? [{ title: userRole === 'ROLE_DIRECTOR' ? 'Mi Departamento' : 'Departamentos', value: stats.departamentos, icon: Building2, color: 'text-emerald-600', bgColor: 'bg-emerald-50', path: '/departamentos' }] : []),
  ];

  if (loading) return <div className="flex h-64 items-center justify-center text-white">Cargando...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/*Mantenemos el degradado elegante, pero el texto es blanco */}
        <Card className="lg:col-span-2 border-none shadow-xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white overflow-hidden relative">
          {/* Decoración sutil */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4"></div>
          
          <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10 h-full justify-between">
            <div className="flex items-center gap-6">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-white">
                      Hola, <span className="text-indigo-200">{profile?.nombre || 'Usuario'}</span>
                  </h1>
                  <p className="text-indigo-100 font-medium text-sm flex items-center gap-2">
                      {userRole === 'ROLE_USER' ? <GraduationCap className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                      {userRole === 'ROLE_ADMIN' ? 'Administrador General' : userRole === 'ROLE_DIRECTOR' ? `Director • ${profile?.cargo}` : 'Alumno • Ingeniería'}
                  </p>
                </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
                <div className="flex items-center gap-2 text-xs font-mono bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-indigo-100">
                  <Mail className="w-3.5 h-3.5" /> {session?.email}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-indigo-100">
                   {userRole === 'ROLE_USER' ? <Hash className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                   {userRole === 'ROLE_USER' ? profile?.numeroBoleta : profile?.numeroTrabajador || 'N/A'}
                </div>
            </div>
          </CardContent>
        </Card>

        {/* INFO CARD: Ahora es BLANCA para que se lea bien */}
        <Card className="shadow-lg border-slate-200 bg-white flex flex-col justify-center">
          <CardContent className="p-6 space-y-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
              <Calendar className="w-3.5 h-3.5" /> Ficha Técnica
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-slate-50 p-2 rounded-lg text-slate-500"><Phone className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Contacto</p>
                  <p className="text-sm font-semibold text-slate-800">{profile?.numeroTelefonico || '---'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-slate-50 p-2 rounded-lg text-slate-500"><Building2 className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Unidad</p>
                  <p className="text-sm font-semibold text-slate-800">{profile?.escuelaPerteneciente || 'ESCOM'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* STATS CARDS: Ahora son BLANCAS */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${userRole === 'ROLE_USER' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} onClick={() => navigate(stat.path)} className="cursor-pointer bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* RESUMEN: Tarjetas BLANCAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <Card className="lg:col-span-2 border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-5 h-5 text-indigo-600" /> Resumen Operativo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-medium text-slate-600">
                    {userRole === 'ROLE_USER' ? 'Mis Protocolos Activos' : 'Total Protocolos Registrados'}
                </span>
                <span className="text-lg font-bold text-indigo-600">{stats.protocolos}</span>
              </div>
              {userRole !== 'ROLE_USER' && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm font-medium text-slate-600">
                        {userRole === 'ROLE_DIRECTOR' ? 'Mi Departamento' : 'Departamentos Globales'}
                    </span>
                    <span className="text-lg font-bold text-indigo-600">{stats.departamentos}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Banner Acceso (Mantenemos color para destacar acción) */}
        <Card className="bg-indigo-600 text-white border-none shadow-lg relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <FileText className="w-32 h-32 -rotate-12" />
          </div>
          <CardContent className="p-8 space-y-6 relative z-10">
            <div>
                <h3 className="text-xl font-bold mb-2">Acceso Rápido</h3>
                <p className="text-indigo-100 text-sm leading-relaxed">
                Gestión centralizada de protocolos de investigación.
                </p>
            </div>
            <Button 
              onClick={() => navigate('/protocolos')} 
              className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-semibold border-none shadow-sm"
            >
              Ir a Protocolos <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}