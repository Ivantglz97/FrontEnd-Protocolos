import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Eye, Pencil, Trash2, Search, Filter, 
  Users, UserCheck, Calendar, BookOpen, ShieldCheck 
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { ProtocoloService } from '../services/api'; 
import { toast } from 'sonner';

export function ProtocolosList() {
  const navigate = useNavigate();
  const [protocolos, setProtocolos] = useState([]);
  const [filteredProtocolos, setFilteredProtocolos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProtocolo, setSelectedProtocolo] = useState(null);

  const session = JSON.parse(sessionStorage.getItem('usuario_ipn'));
  const userRole = session?.rol;
  const userId = session?.idUsuario;

  useEffect(() => { loadProtocolos(); }, []);
  useEffect(() => { filterProtocolos(); }, [searchTerm, estadoFilter, protocolos]);

  const loadProtocolos = async () => {
    try {
      setLoading(true);
      const response = await ProtocoloService.getAll();
      setProtocolos(response.data || []);
    } catch (error) { toast.error('Error al cargar protocolos'); } finally { setLoading(false); }
  };

  const filterProtocolos = () => {
    let filtered = [...protocolos];
    if (searchTerm) {
      filtered = filtered.filter(p =>
          p.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter(p => p.estado?.toLowerCase() === estadoFilter.toLowerCase());
    }
    setFilteredProtocolos(filtered);
  };

  const canModify = (protocolo) => {
    if (userRole === 'ROLE_ADMIN') return true;
    if (userRole === 'ROLE_USER') return false;
    if (userRole === 'ROLE_DIRECTOR') {
      return protocolo.directoresAsignados?.some(rel => rel.director.usuario?.idUsuario === userId || rel.director.idUsuario === userId);
    }
    return false;
  };

  const handleDelete = async () => {
    if (!selectedProtocolo) return;
    try {
      await ProtocoloService.delete(selectedProtocolo.idProtocolo);
      toast.success('Protocolo eliminado');
      setDeleteDialogOpen(false);
      loadProtocolos();
    } catch (error) { toast.error('Error al eliminar'); }
  };

  // ✅ NUEVOS COLORES DE ESTADO (ESTILO PROFESIONAL)
  const getEstadoBadge = (estado) => {
    const st = estado?.toLowerCase() || '';
    if (st.includes('pendiente')) return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100';
    if (st.includes('proceso')) return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100';
    if (st.includes('aprobado') || st.includes('activo')) return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100';
    if (st.includes('rechazado')) return 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-100';
    if (st.includes('finalizado')) return 'bg-slate-100 text-slate-700 border-slate-200 ring-1 ring-slate-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400">Cargando...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white-900 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-600" /> Gestión de Protocolos
          </h1>
          <p className="text-slate-500">Administra los proyectos de investigación y sus participantes</p>
        </div>
        {userRole !== 'ROLE_USER' && (
          <Button onClick={() => navigate('/protocolos/nuevo')} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 text-white">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Protocolo
          </Button>
        )}
      </div>

      <Card className="p-4 shadow-sm border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input placeholder="Buscar por título o descripción..." className="pl-10 bg-slate-50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-[200px] bg-white border-slate-200"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="En proceso">En proceso</SelectItem>
                <SelectItem value="Aprobado">Aprobado</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {filteredProtocolos.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-slate-300 p-20 text-center text-slate-400">No se encontraron resultados</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredProtocolos.map((p) => {
            const tienePermiso = canModify(p);
            return (
              <Card key={p.idProtocolo} className="flex flex-col hover:border-indigo-300 hover:shadow-md transition-all duration-200 shadow-sm border-slate-200">
                <CardHeader className="pb-3 border-b border-slate-50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 w-full">
                      <div className="flex justify-between items-start">
                         <CardTitle className="text-xl leading-tight text-gray-900 line-clamp-1">{p.titulo}</CardTitle>
                         <Badge variant="outline" className={`${getEstadoBadge(p.estado)} px-3 py-0.5 ml-2 whitespace-nowrap`}>{p.estado}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-5 pt-4">
                  <CardDescription className="text-slate-600 text-sm leading-relaxed">{p.descripcion}</CardDescription>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
                        <Users className="w-3.5 h-3.5" /> Alumnos
                      </div>
                      <div className="text-sm space-y-1.5 text-slate-700 bg-indigo-50/50 p-2 rounded-lg border border-indigo-50">
                        {[p.alumno1, p.alumno2, p.alumno3, p.alumno4].filter(Boolean).map(a => (
                            <p key={a.numeroBoleta} className="truncate flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>{a.nombre}</p>
                        ))}
                        {![p.alumno1, p.alumno2, p.alumno3, p.alumno4].some(Boolean) && <p className="italic text-slate-400">Sin alumnos</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-600">
                        <UserCheck className="w-3.5 h-3.5" /> Directores
                      </div>
                      <div className="text-sm space-y-1.5 text-slate-700 bg-violet-50/50 p-2 rounded-lg border border-violet-50">
                        {p.directoresAsignados?.length > 0 ? p.directoresAsignados.map(rel => (
                            <p key={rel.idRegistro} className="truncate flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>{rel.director.nombre}</p>
                        )) : <p className="italic text-slate-400">Sin asignar</p>}
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-between items-center border-t border-slate-50 gap-4">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" /> <span>{new Date(p.fechaRegistro).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 border-slate-200" onClick={() => navigate(`/protocolos/${p.idProtocolo}`)}>
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Detalle
                      </Button>
                      {tienePermiso && (
                        <>
                          <Button variant="outline" size="sm" className="h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => navigate(`/protocolos/editar/${p.idProtocolo}`)}>
                            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-rose-500 hover:bg-rose-50" onClick={() => { setSelectedProtocolo(p); setDeleteDialogOpen(true); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      {!tienePermiso && userRole !== 'ROLE_USER' && (
                         <div className="h-8 w-8 flex items-center justify-center rounded-md bg-slate-50 border border-slate-200 text-slate-400" title="Lectura"><ShieldCheck className="w-4 h-4" /></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {/* Dialogo Eliminación (Mismo código, solo colores de alerta) */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-rose-600">Eliminar Protocolo</DialogTitle></DialogHeader>
          <p className="text-slate-600">¿Estás seguro de eliminar "{selectedProtocolo?.titulo}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}