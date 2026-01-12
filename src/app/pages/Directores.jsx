import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, User, Briefcase } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { DirectorService, DepartamentoService, UsuarioService, ProtocoloService } from '../services/api'; 
import { toast } from 'sonner';

export function Directores() {
  const [directores, setDirectores] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const session = JSON.parse(sessionStorage.getItem('usuario_ipn'));
  const userRole = session?.rol;
  const userId = session?.idUsuario;

  const [formData, setFormData] = useState({
    nombre: '', apellidoPaterno: '', apellidoMaterno: '',
    escuelaPerteneciente: 'ESCOM', cargo: 'Jefe de Departamento',
    numeroTelefonico: '', idDepartamentoSeleccionado: '', idUsuarioSeleccionado: ''
  });

  useEffect(() => { loadData(); }, []);
  useEffect(() => { filterData(); }, [searchTerm, directores]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dirRes, depRes, userRes, protoRes] = await Promise.all([
        DirectorService.getAll(), DepartamentoService.getAll(), UsuarioService.getAll(), ProtocoloService.getAll()
      ]);
      
      let allDirectores = dirRes.data || [];
      const allProtocolos = protoRes.data || [];

      if (userRole !== 'ROLE_ADMIN') {
        const misProtocolos = allProtocolos.filter(p => {
            const soyAlumno = [p.alumno1, p.alumno2, p.alumno3, p.alumno4].some(a => a?.usuario?.idUsuario === userId);
            const soyDirector = p.directoresAsignados?.some(d => d.director.usuario?.idUsuario === userId);
            return soyAlumno || soyDirector;
        });
        const directoresVisibles = new Set();
        misProtocolos.forEach(p => {
            p.directoresAsignados?.forEach(rel => { if(rel.director) directoresVisibles.add(rel.director.numeroTrabajador); });
        });
        if(userRole === 'ROLE_DIRECTOR') {
            const miPerfil = allDirectores.find(d => d.usuario?.idUsuario === userId);
            if(miPerfil) directoresVisibles.add(miPerfil.numeroTrabajador);
        }
        allDirectores = allDirectores.filter(d => directoresVisibles.has(d.numeroTrabajador));
      }

      setDirectores(allDirectores);
      setFiltered(allDirectores);
      setDepartamentos(depRes.data || []);
      const usersDirectores = (userRes.data || []).filter(u => u.rol === 'ROLE_DIRECTOR');
      setUsuariosDisponibles(usersDirectores);

    } catch (error) { toast.error('Error al cargar datos'); } finally { setLoading(false); }
  };

  const filterData = () => {
    const term = searchTerm.toLowerCase();
    const result = directores.filter(item =>
        (item.nombre || '').toLowerCase().includes(term) ||
        (item.apellidoPaterno || '').toLowerCase().includes(term) ||
        (item.departamento?.nombreDepartamento || '').toLowerCase().includes(term)
    );
    setFiltered(result);
  };

  const handleOpenDialog = (director) => {
    if (director) {
      setSelectedItem(director);
      setFormData({
        nombre: director.nombre, apellidoPaterno: director.apellidoPaterno, apellidoMaterno: director.apellidoMaterno,
        escuelaPerteneciente: director.escuelaPerteneciente || '', cargo: director.cargo || '',
        numeroTelefonico: director.numeroTelefonico || '',
        idDepartamentoSeleccionado: director.departamento?.idDepartamento?.toString() || '',
        idUsuarioSeleccionado: director.usuario?.idUsuario?.toString() || '' 
      });
    } else {
      setSelectedItem(null);
      setFormData({
        nombre: '', apellidoPaterno: '', apellidoMaterno: '',
        escuelaPerteneciente: 'ESCOM', cargo: 'Docente',
        numeroTelefonico: '', idDepartamentoSeleccionado: '', idUsuarioSeleccionado: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.idDepartamentoSeleccionado) return toast.error('Debes seleccionar un departamento');
    if (!formData.idUsuarioSeleccionado) return toast.error('Debes asociar una cuenta de usuario');

    const payload = {
      nombre: formData.nombre, apellidoPaterno: formData.apellidoPaterno, apellidoMaterno: formData.apellidoMaterno,
      escuelaPerteneciente: formData.escuelaPerteneciente, cargo: formData.cargo, numeroTelefonico: formData.numeroTelefonico,
      departamento: { idDepartamento: parseInt(formData.idDepartamentoSeleccionado) },
      usuario: { idUsuario: parseInt(formData.idUsuarioSeleccionado) }
    };

    try {
      if (selectedItem) { await DirectorService.update(selectedItem.numeroTrabajador, payload); toast.success('Actualizado'); } 
      else { await DirectorService.create(payload); toast.success('Creado'); }
      setDialogOpen(false); loadData();
    } catch (error) { toast.error('Error al guardar'); }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try { await DirectorService.delete(selectedItem.numeroTrabajador); toast.success('Eliminado'); setDeleteDialogOpen(false); loadData(); } 
    catch (error) { toast.error('Error al eliminar'); }
  };

  const handleChange = (e) => { setFormData(prev => ({ ...prev, [e.target.id]: e.target.value })); };

  if (loading) return <div className="flex items-center justify-center h-64 text-[#AEB9E1]">Cargando...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <div className="flex items-center gap-3 mb-1">
                <div className="bg-[#6C72FF]/20 p-2 rounded-lg text-[#6C72FF]">
                    <Briefcase className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold text-white">Directores</h1>
            </div>
            <p className="text-[#AEB9E1] ml-11">Administra a los encargados de departamento</p>
        </div>
        
        {/* BOTÓN DE ACCIÓN */}
        {userRole === 'ROLE_ADMIN' && (
          <Button onClick={() => handleOpenDialog()} className="bg-[#6C72FF] hover:bg-[#585ed6] text-white shadow-lg shadow-[#6C72FF]/20 border-none">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Director
          </Button>
        )}
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* TABLA BLANCA */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="text-slate-600 font-semibold">Nombre</TableHead>
              <TableHead className="text-slate-600 font-semibold">Cargo / Escuela</TableHead>
              <TableHead className="text-slate-600 font-semibold">Departamento</TableHead>
              <TableHead className="text-slate-600 font-semibold">Cuenta de Usuario</TableHead>
              <TableHead className="text-slate-600 font-semibold">Contacto</TableHead>
              {userRole === 'ROLE_ADMIN' && <TableHead className="text-right text-slate-600 font-semibold">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={userRole === 'ROLE_ADMIN' ? 6 : 5} className="text-center py-12 text-slate-400">
                  {userRole === 'ROLE_ADMIN' ? 'No hay directores registrados' : 'No hay directores visibles'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.numeroTrabajador} className="hover:bg-slate-50/50 border-slate-100 transition-colors"> 
                  <TableCell className="font-medium text-slate-800">
                    {item.nombre} {item.apellidoPaterno} {item.apellidoMaterno}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-indigo-600">{item.cargo}</div>
                    <div className="text-xs text-slate-400">{item.escuelaPerteneciente}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {item.departamento ? item.departamento.nombreDepartamento : 'Sin Asignar'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.usuario ? (
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                            <User className="w-3 h-3 text-slate-400" /> {item.usuario.email}
                        </div>
                    ) : <span className="text-rose-400 text-xs italic">Sin cuenta</span>}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{item.numeroTelefonico}</TableCell>
                  {userRole === 'ROLE_ADMIN' && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="hover:bg-indigo-50 hover:text-indigo-600 text-slate-400" onClick={() => handleOpenDialog(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-rose-50 hover:text-rose-600 text-slate-400" onClick={() => { setSelectedItem(item); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* DIÁLOGO (Limpio) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{selectedItem ? 'Editar Director' : 'Nuevo Director'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div>
              <Label htmlFor="nombre" className="text-slate-700">Nombre</Label>
              <Input id="nombre" value={formData.nombre} onChange={handleChange} className="bg-white border-slate-200 text-slate-900" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="apellidoPaterno" className="text-slate-700">Ap. Paterno</Label>
                <Input id="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange} className="bg-white border-slate-200 text-slate-900" />
              </div>
              <div>
                <Label htmlFor="apellidoMaterno" className="text-slate-700">Ap. Materno</Label>
                <Input id="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} className="bg-white border-slate-200 text-slate-900" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="escuelaPerteneciente" className="text-slate-700">Escuela</Label>
                    <Input id="escuelaPerteneciente" value={formData.escuelaPerteneciente} onChange={handleChange} className="bg-white border-slate-200 text-slate-900" />
                </div>
                <div>
                    <Label htmlFor="cargo" className="text-slate-700">Cargo</Label>
                    <Input id="cargo" value={formData.cargo} onChange={handleChange} className="bg-white border-slate-200 text-slate-900" />
                </div>
            </div>

            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 space-y-2">
                <Label className="text-indigo-900 font-medium">Cuenta de Usuario</Label>
                <Select value={formData.idUsuarioSeleccionado} onValueChange={(val) => setFormData(prev => ({ ...prev, idUsuarioSeleccionado: val }))}>
                    <SelectTrigger className="bg-white border-indigo-200 text-indigo-900"><SelectValue placeholder="Selecciona cuenta" /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                    {usuariosDisponibles.map((u) => (
                        <SelectItem key={u.idUsuario} value={u.idUsuario.toString()} className="text-slate-700 focus:bg-indigo-50">
                            {u.email} ({u.rol?.replace('ROLE_', '')})
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
              <Label className="text-slate-700">Departamento</Label>
              <Select value={formData.idDepartamentoSeleccionado} onValueChange={(val) => setFormData(prev => ({ ...prev, idDepartamentoSeleccionado: val }))}>
                <SelectTrigger className="bg-white border-slate-200 text-slate-900"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {departamentos.map((dep) => (
                    <SelectItem key={dep.idDepartamento} value={dep.idDepartamento.toString()} className="text-slate-700 focus:bg-slate-50">
                      {dep.nombreDepartamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="numeroTelefonico" className="text-slate-700">Teléfono</Label>
              <Input id="numeroTelefonico" value={formData.numeroTelefonico} onChange={handleChange} maxLength={15} className="bg-white border-slate-200 text-slate-900" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-200 text-slate-600 bg-white">Cancelar</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader><DialogTitle className="text-rose-600">¿Eliminar Director?</DialogTitle></DialogHeader>
          <p className="text-slate-600 text-sm">Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-slate-200 text-slate-600">Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 border-none">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}