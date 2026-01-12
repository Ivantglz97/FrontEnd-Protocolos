import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, UserPlus, Download, Mail, Users, UserCheck,      
  FileText, Calendar, Trash2, GraduationCap, ShieldCheck 
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

import { 
  ProtocoloService, 
  DirectorService, 
  ProtocoloDirectorService,
  ReporteService 
} from '../services/api';

export function ProtocoloDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [protocolo, setProtocolo] = useState(null);
  const [directoresAsignados, setDirectoresAsignados] = useState([]);
  const [todosDirectores, setTodosDirectores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [asignarDialogOpen, setAsignarDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedDirectorId, setSelectedDirectorId] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const session = JSON.parse(sessionStorage.getItem('usuario_ipn'));
  const userRole = session?.rol;
  const userId = session?.idUsuario;

  useEffect(() => { if (id) loadData(); }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [protocoloRes, directoresRes, asignacionesRes] = await Promise.all([
        ProtocoloService.getById(id),
        DirectorService.getAll(),
        ProtocoloDirectorService.getByProtocoloId(id)
      ]);

      setProtocolo(protocoloRes.data);
      setTodosDirectores(directoresRes.data || []);
      
      setDirectoresAsignados((asignacionesRes.data || []).map(item => ({
        idRegistro: item.idRegistro,
        directorId: item.director.numeroTrabajador,
        nombre: item.director.nombre,
        apellidoPaterno: item.director.apellidoPaterno,
        departamento: item.director.departamento?.nombreDepartamento || 'Sin Depto',
        usuarioId: item.director.usuario?.idUsuario 
      })));

    } catch (error) {
      console.error(error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Permiso para EDITAR (Solo Admin o Director asignado)
  const canModify = () => {
    if (userRole === 'ROLE_ADMIN') return true;
    if (userRole === 'ROLE_USER') return false; 
    if (userRole === 'ROLE_DIRECTOR') return directoresAsignados.some(d => d.usuarioId === userId);
    return false;
  };

  // ✅ NUEVA VALIDACIÓN: Permiso para REPORTES (Incluye Alumnos del proyecto)
  const verificarPertenencia = () => {
    if (!protocolo) return false;
    
    // 1. Admin siempre puede
    if (userRole === 'ROLE_ADMIN') return true;

    // 2. Director: Debe estar asignado
    if (userRole === 'ROLE_DIRECTOR') {
      return directoresAsignados.some(d => d.usuarioId === userId);
    }

    // 3. Alumno: Debe ser uno de los 4 integrantes
    if (userRole === 'ROLE_USER') {
      const alumnos = [protocolo.alumno1, protocolo.alumno2, protocolo.alumno3, protocolo.alumno4];
      // Verificamos si el usuario actual es alguno de los alumnos listados
      return alumnos.some(a => a?.usuario?.idUsuario === userId);
    }

    return false;
  };

  const tienePermisoEdicion = canModify(); 
  const esParticipante = verificarPertenencia(); // Variable para controlar vista de reportes

  const handleAsignarDirector = async () => {
    if (!selectedDirectorId) return toast.error('Selecciona un director');
    try {
      await ProtocoloDirectorService.create({ protocolo: { idProtocolo: id }, director: { numeroTrabajador: selectedDirectorId } });
      toast.success('Asignado correctamente');
      setAsignarDialogOpen(false); setSelectedDirectorId(''); loadData(); 
    } catch (error) { toast.error('No se pudo asignar'); }
  };
  
  const handleDesasignar = async (idRegistro) => {
      try { await ProtocoloDirectorService.delete(idRegistro); toast.success('Eliminado'); loadData(); } 
      catch (error) { toast.error('Error al eliminar'); }
  };

  const handleDescargarPDF = async () => {
    try {
      toast.loading('Generando PDF...', { id: 'pdf' });
      const res = await ReporteService.descargarPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', `Protocolo_${id}.pdf`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast.success('Listo', { id: 'pdf' });
    } catch (error) { toast.error('Error', { id: 'pdf' }); }
  };

  const handleEnviarCorreo = async () => {
    if (!emailInput) return toast.error('Correo inválido');
    try {
      toast.loading('Enviando...', { id: 'mail' });
      await ReporteService.enviarEmail({
        protocoloId: id, destinatario: emailInput, asunto: `Seguimiento: ${protocolo.titulo}`,
        nombreAlumno: "Sistema", nombreProponente: "IPN - ESCOM", contacto: "admin@ipn.mx"
      });
      setEmailDialogOpen(false); setEmailInput(''); toast.success('Enviado', { id: 'mail' });
    } catch (error) { toast.error('Error', { id: 'mail' }); }
  };

  const getEstadoBadge = (estado) => {
    const st = estado?.toLowerCase() || '';
    if (st.includes('pendiente')) return 'bg-[#FDB52A]/20 text-[#FDB52A] border-[#FDB52A]/50';
    if (st.includes('proceso')) return 'bg-[#57C3FF]/20 text-[#57C3FF] border-[#57C3FF]/50';
    if (st.includes('aprobado') || st.includes('activo')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    if (st.includes('rechazado')) return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
    return 'bg-[#212C4D] text-[#AEB9E1] border-[#37446B]';
  };

  const directoresDisponibles = todosDirectores.filter(d => !directoresAsignados.some(a => a.directorId === d.numeroTrabajador));

  if (loading || !protocolo) return <div className="flex h-64 items-center justify-center text-[#AEB9E1]">Cargando...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/protocolos')} className="mb-4 text-[#AEB9E1] hover:text-white hover:bg-[#212C4D]">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a protocolos
        </Button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{protocolo.titulo}</h1>
            <Badge className={`${getEstadoBadge(protocolo.estado)} text-sm px-3 py-1 border`}>{protocolo.estado}</Badge>
          </div>
          
          {tienePermisoEdicion ? (
            <Button onClick={() => navigate(`/protocolos/editar/${id}`)} className="bg-[#6C72FF] hover:bg-[#585ed6] text-white shadow-lg shadow-[#6C72FF]/20 border-none">
              <Pencil className="w-4 h-4 mr-2" /> Editar Información
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-[#AEB9E1] bg-[#101935] px-3 py-2 rounded-lg border border-[#212C4D]">
                <ShieldCheck className="w-4 h-4" /><span className="text-sm font-medium">Modo Lectura</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA (INFO PRINCIPAL) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[#212C4D] bg-[#101935] shadow-lg">
            <CardHeader><CardTitle className="flex items-center gap-2 text-white"><FileText className="w-5 h-5 text-[#6C72FF]" />Información del Proyecto</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-[#57C3FF] uppercase tracking-wider mb-1">Descripción</p>
                  <p className="text-[#AEB9E1] text-sm leading-relaxed">{protocolo.descripcion}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#57C3FF] uppercase tracking-wider mb-1">Objetivos</p>
                  <p className="text-[#AEB9E1] text-sm leading-relaxed">{protocolo.objetivos}</p>
                </div>
              </div>
              <div className="h-px bg-[#212C4D] my-2" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-[#57C3FF] uppercase tracking-wider mb-1">Perfil Requerido</p>
                  <p className="text-[#AEB9E1] text-sm">{protocolo.perfilRequerido}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#57C3FF] uppercase tracking-wider mb-1">Fecha de Registro</p>
                  <p className="text-[#AEB9E1] text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(protocolo.fechaRegistro).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TARJETA ALUMNOS */}
          <Card className="border-[#212C4D] bg-[#101935] shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#57C3FF]"><GraduationCap className="w-5 h-5" />Alumnos Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[protocolo.alumno1, protocolo.alumno2, protocolo.alumno3, protocolo.alumno4].filter(Boolean).length > 0 ? (
                  [protocolo.alumno1, protocolo.alumno2, protocolo.alumno3, protocolo.alumno4].filter(Boolean).map((alumno, idx) => (
                      <div key={idx} className="p-3 bg-[#080F25] rounded-lg border border-[#212C4D] flex items-center gap-3 hover:border-[#57C3FF]/50 transition-colors">
                        <div className="bg-[#101935] p-2 rounded-full border border-[#212C4D] text-[#57C3FF]"><Users className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-semibold text-white">{alumno.nombre} {alumno.apellidoPaterno || ''}</p>
                          <p className="text-xs text-[#AEB9E1] font-mono">Boleta: {alumno.numeroBoleta}</p>
                        </div>
                      </div>
                    ))
                ) : <p className="text-[#AEB9E1]/50 text-sm italic col-span-2 text-center py-4">No hay alumnos registrados</p>}
              </div>
            </CardContent>
          </Card>

          {/* TARJETA DIRECTORES */}
          <Card className="border-[#212C4D] bg-[#101935] shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[#FDB52A]"><UserCheck className="w-5 h-5" />Directores</CardTitle>
                {tienePermisoEdicion && (
                  <Button size="sm" variant="outline" onClick={() => setAsignarDialogOpen(true)} disabled={directoresDisponibles.length === 0} className="border-[#FDB52A]/50 text-[#FDB52A] hover:bg-[#FDB52A]/10 bg-transparent">
                    <UserPlus className="w-4 h-4 mr-2" />Añadir
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {directoresAsignados.length === 0 ? <p className="text-[#AEB9E1]/50 text-sm italic text-center py-6">Sin directores asignados</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {directoresAsignados.map((asignacion) => (
                    <div key={asignacion.idRegistro} className="flex items-center justify-between p-3 bg-[#080F25] rounded-lg border border-[#212C4D]">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#101935] p-2 rounded-full border border-[#212C4D] text-[#FDB52A]"><Users className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-semibold text-white">{asignacion.nombre} {asignacion.apellidoPaterno}</p>
                          <p className="text-[10px] text-[#FDB52A] font-bold uppercase">{asignacion.departamento}</p>
                        </div>
                      </div>
                      {tienePermisoEdicion && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => handleDesasignar(asignacion.idRegistro)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">
           {/* TARJETA DE REPORTES (CON VALIDACIÓN) */}
           <Card className="bg-[#6C72FF] text-white border-none shadow-xl">
             <CardHeader>
               <CardTitle className="text-white flex gap-2"><Download className="w-5 h-5" />Reportes</CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
               
               {/* CONDICIONAL: Solo mostramos botones a participantes */}
               {esParticipante ? (
                 <>
                   <Button className="w-full bg-[#101935] text-white hover:bg-[#080F25] border-none" onClick={handleDescargarPDF}>
                     <FileText className="w-4 h-4 mr-2" />Descargar PDF
                   </Button>
                   <Button className="w-full bg-white/10 text-white border border-white/20 hover:bg-white/20" variant="outline" onClick={() => setEmailDialogOpen(true)}>
                     <Mail className="w-4 h-4 mr-2" />Enviar Correo
                   </Button>
                 </>
               ) : (
                 <div className="text-center p-3 bg-[#101935]/50 rounded-lg border border-white/10">
                    <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-white/60" />
                    <p className="text-xs text-white/80 leading-tight">
                      Solo los miembros del protocolo pueden generar reportes.
                    </p>
                 </div>
               )}
             </CardContent>
           </Card>

           <Card className="border-[#212C4D] bg-[#101935] shadow-lg">
             <CardHeader><CardTitle className="text-sm uppercase text-[#AEB9E1]">Resumen</CardTitle></CardHeader>
             <CardContent className="space-y-4">
               <div className="flex justify-between text-sm"><span className="text-[#AEB9E1]">Folio Interno</span><span className="font-mono font-bold text-[#6C72FF]">#{protocolo.idProtocolo}</span></div>
               <div className="h-px bg-[#212C4D] my-2" />
               <div className="flex justify-between text-sm"><span className="text-[#AEB9E1]">Directores</span><Badge variant="secondary" className="bg-[#212C4D] text-white">{directoresAsignados.length}</Badge></div>
               <div className="flex justify-between text-sm"><span className="text-[#AEB9E1]">Alumnos</span><Badge variant="secondary" className="bg-[#212C4D] text-white">{[protocolo.alumno1, protocolo.alumno2, protocolo.alumno3, protocolo.alumno4].filter(Boolean).length}</Badge></div>
             </CardContent>
           </Card>
        </div>
      </div>

      {/* DIÁLOGO EMAIL */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#101935] border-[#212C4D] text-white">
          <DialogHeader>
            <DialogTitle>Enviar Reporte</DialogTitle>
            <DialogDescription className="text-[#AEB9E1]">Se enviará el PDF al correo especificado.</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <Label htmlFor="email" className="text-[#AEB9E1]">Destinatario</Label>
            <Input 
                id="email" 
                type="email" 
                placeholder="ejemplo@ipn.mx" 
                value={emailInput} 
                onChange={(e) => setEmailInput(e.target.value)} 
                className="bg-[#080F25] border-[#212C4D] text-white placeholder:text-[#37446B]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)} className="border-[#212C4D] text-[#AEB9E1] hover:bg-[#212C4D] hover:text-white bg-transparent">Cancelar</Button>
            <Button onClick={handleEnviarCorreo} className="bg-[#6C72FF] hover:bg-[#585ed6] text-white border-none">Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO ASIGNAR */}
      <Dialog open={asignarDialogOpen} onOpenChange={setAsignarDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#101935] border-[#212C4D] text-white">
          <DialogHeader><DialogTitle>Asignar Nuevo Director</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-[#AEB9E1]">Director disponible</Label>
              <Select value={selectedDirectorId} onValueChange={setSelectedDirectorId}>
                <SelectTrigger className="w-full bg-[#080F25] border-[#212C4D] text-white">
                    <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-[#101935] border-[#212C4D] text-white">
                  {directoresDisponibles.map((dir) => (
                    <SelectItem key={dir.numeroTrabajador} value={dir.numeroTrabajador.toString()} className="focus:bg-[#212C4D] focus:text-white">
                      {dir.nombre} {dir.apellidoPaterno}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAsignarDialogOpen(false)} className="border-[#212C4D] text-[#AEB9E1] hover:bg-[#212C4D] hover:text-white bg-transparent">Cancelar</Button>
            <Button onClick={handleAsignarDirector} className="bg-[#FDB52A] hover:bg-[#e0a125] text-black font-bold border-none">Asignar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}