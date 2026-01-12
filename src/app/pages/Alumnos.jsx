import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, User, CreditCard, GraduationCap, Mail } from 'lucide-react';
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
import { AlumnoService, UsuarioService, ProtocoloService } from '../services/api'; 
import { toast } from 'sonner';

export function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [filteredAlumnos, setFilteredAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  
  const session = JSON.parse(sessionStorage.getItem('usuario_ipn'));
  const userRole = session?.rol;
  const userId = session?.idUsuario;

  const [formData, setFormData] = useState({
    numeroBoleta: '', nombre: '', apellidoPaterno: '', apellidoMaterno: '',
    semestre: '', carrera: '', numeroTelefonico: '', idUsuario: '', 
  });

  useEffect(() => { loadData(); }, []);
  useEffect(() => { filterAlumnos(); }, [searchTerm, alumnos]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resAlumnos, resUsuarios, resProtocolos] = await Promise.all([
        AlumnoService.getAll(), UsuarioService.getAll(), ProtocoloService.getAll()
      ]);

      let allAlumnos = resAlumnos.data || [];
      const allProtocolos = resProtocolos.data || [];
      
      if (userRole !== 'ROLE_ADMIN') {
        const misProtocolos = allProtocolos.filter(p => {
            const soyAlumno = [p.alumno1, p.alumno2, p.alumno3, p.alumno4].some(a => a?.usuario?.idUsuario === userId);
            const soyDirector = p.directoresAsignados?.some(d => d.director.usuario?.idUsuario === userId);
            return soyAlumno || soyDirector;
        });
        const boletasVisibles = new Set();
        misProtocolos.forEach(p => {
            [p.alumno1, p.alumno2, p.alumno3, p.alumno4].forEach(a => { if (a) boletasVisibles.add(a.numeroBoleta); });
        });
        if(userRole === 'ROLE_USER') {
            const miPerfil = allAlumnos.find(a => a.usuario?.idUsuario === userId);
            if(miPerfil) boletasVisibles.add(miPerfil.numeroBoleta);
        }
        allAlumnos = allAlumnos.filter(a => boletasVisibles.has(a.numeroBoleta));
      }

      setAlumnos(allAlumnos);
      setFilteredAlumnos(allAlumnos);
      setUsuariosDisponibles(resUsuarios.data || []);
    } catch (error) { toast.error('Error al conectar con el servidor'); } finally { setLoading(false); }
  };

  const filterAlumnos = () => {
    const term = searchTerm.toLowerCase();
    const filtered = alumnos.filter(a =>
        (a.nombre || '').toLowerCase().includes(term) ||
        (a.apellidoPaterno || '').toLowerCase().includes(term) ||
        (a.numeroBoleta?.toString() || '').includes(term)
    );
    setFilteredAlumnos(filtered);
  };

  const handleOpenDialog = (alumno) => {
    if (alumno) {
      setSelectedAlumno(alumno);
      setFormData({
        numeroBoleta: alumno.numeroBoleta, nombre: alumno.nombre, apellidoPaterno: alumno.apellidoPaterno,
        apellidoMaterno: alumno.apellidoMaterno, semestre: alumno.semestre, carrera: alumno.carrera,
        numeroTelefonico: alumno.numeroTelefonico, idUsuario: alumno.usuario?.idUsuario?.toString() || '',
      });
    } else {
      setSelectedAlumno(null);
      setFormData({
        numeroBoleta: '', nombre: '', apellidoPaterno: '', apellidoMaterno: '',
        semestre: '', carrera: '', numeroTelefonico: '', idUsuario: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.numeroBoleta) return toast.error("La boleta es obligatoria");
    if (!formData.idUsuario) return toast.error("Asigna un usuario");

    try {
      const payload = {
        numeroBoleta: formData.numeroBoleta, nombre: formData.nombre, apellidoPaterno: formData.apellidoPaterno,
        apellidoMaterno: formData.apellidoMaterno, semestre: formData.semestre, carrera: formData.carrera,
        numeroTelefonico: formData.numeroTelefonico, usuario: { idUsuario: parseInt(formData.idUsuario) } 
      };
      if (selectedAlumno) {
        await AlumnoService.update(selectedAlumno.numeroBoleta, payload); toast.success('Actualizado');
      } else {
        await AlumnoService.create(payload); toast.success('Creado');
      }
      setDialogOpen(false); loadData();
    } catch (error) { toast.error('Error al guardar'); }
  };

  const handleDelete = async () => {
    if (!selectedAlumno) return;
    try { await AlumnoService.delete(selectedAlumno.numeroBoleta); toast.success('Eliminado'); setDeleteDialogOpen(false); loadData(); } 
    catch (error) { toast.error('No se pudo eliminar'); }
  };

  const handleChange = (e) => { setFormData(prev => ({ ...prev, [e.target.id]: e.target.value })); };

  if (loading) return <div className="flex items-center justify-center h-64 text-[#AEB9E1]">Cargando datos...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER: Texto Blanco sobre fondo oscuro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <div className="flex items-center gap-3 mb-1">
                <div className="bg-[#6C72FF]/20 p-2 rounded-lg text-[#6C72FF]">
                    <GraduationCap className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold text-white">Gestión de Alumnos</h1>
            </div>
            <p className="text-[#AEB9E1] ml-11">Administra el catálogo de estudiantes</p>
        </div>
        
        {/* BOTÓN NEÓN */}
        {userRole === 'ROLE_ADMIN' && (
            <Button onClick={() => handleOpenDialog()} className="bg-[#6C72FF] hover:bg-[#585ed6] text-white shadow-lg shadow-[#6C72FF]/20 border-none">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Alumno
            </Button>
        )}
      </div>

      {/* BARRA DE BÚSQUEDA: BLANCA (Clean Light) */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
                placeholder="Buscar por boleta o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 transition-all"
            />
        </div>
      </div>

      {/* TABLA: BLANCA (Clean Light) */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="text-slate-600 font-semibold">Boleta</TableHead>
              <TableHead className="text-slate-600 font-semibold">Nombre Completo</TableHead>
              <TableHead className="text-slate-600 font-semibold">Carrera / Semestre</TableHead>
              <TableHead className="text-slate-600 font-semibold">Cuenta de Acceso</TableHead>
              {userRole === 'ROLE_ADMIN' && <TableHead className="text-right text-slate-600 font-semibold">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlumnos.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={userRole === 'ROLE_ADMIN' ? 5 : 4} className="text-center py-12 text-slate-400">
                        {userRole === 'ROLE_ADMIN' ? 'No hay alumnos registrados' : 'No tienes permisos para ver otros alumnos'}
                    </TableCell>
                </TableRow>
            ) : (
                filteredAlumnos.map((alumno) => (
                <TableRow key={alumno.numeroBoleta} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                    {/* Datos en oscuro para contraste */}
                    <TableCell className="font-mono text-indigo-600 font-medium">{alumno.numeroBoleta}</TableCell>
                    <TableCell className="text-slate-800 font-medium">
                        {`${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}`}
                    </TableCell>
                    <TableCell className="text-slate-500">
                        {alumno.carrera} <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 border border-slate-200 ml-1">{alumno.semestre}° Sem</span>
                    </TableCell>
                    <TableCell>
                        {alumno.usuario ? (
                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded-lg w-fit border border-slate-200">
                                <Mail className="w-3 h-3 text-slate-400" /> 
                                {alumno.usuario.email}
                            </div>
                        ) : (
                            <span className="text-xs text-rose-500 italic">Sin asignar</span>
                        )}
                    </TableCell>
                    
                    {userRole === 'ROLE_ADMIN' && (
                        <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="hover:bg-indigo-50 hover:text-indigo-600 text-slate-400" onClick={() => handleOpenDialog(alumno)}>
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-rose-50 hover:text-rose-600 text-slate-400" onClick={() => { setSelectedAlumno(alumno); setDeleteDialogOpen(true); }}>
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

      {/* MODAL (Blanco limpio) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{selectedAlumno ? 'Editar Alumno' : 'Nuevo Alumno'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            
            <div className="space-y-2">
              <Label htmlFor="numeroBoleta" className="text-slate-700">Número de Boleta (ID)</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  id="numeroBoleta" 
                  value={formData.numeroBoleta} 
                  onChange={handleChange} 
                  className="pl-10 bg-white border-slate-200 text-slate-900 focus:ring-indigo-500"
                  disabled={selectedAlumno !== null} 
                />
              </div>
            </div>

            <div className="bg-indigo-50 p-3 rounded-lg space-y-2 border border-indigo-100">
              <Label className="text-indigo-900 font-medium">Cuenta de Usuario</Label>
              <Select 
                value={formData.idUsuario?.toString()} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, idUsuario: val }))}
              >
                <SelectTrigger className="bg-white border-indigo-200 text-indigo-900">
                  <SelectValue placeholder="Vincular email" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {usuariosDisponibles.map(user => (
                    <SelectItem key={user.idUsuario} value={user.idUsuario.toString()} className="focus:bg-indigo-50 text-slate-700">
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="nombre" className="text-slate-700">Nombre(s)</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="carrera" className="text-slate-700">Carrera</Label>
                <Input id="carrera" value={formData.carrera} onChange={handleChange} className="bg-white border-slate-200 text-slate-900" />
              </div>
              <div>
                <Label htmlFor="semestre" className="text-slate-700">Semestre</Label>
                <Input id="semestre" value={formData.semestre} onChange={handleChange} className="bg-white border-slate-200 text-slate-900" />
              </div>
            </div>
            <div>
                <Label htmlFor="numeroTelefonico" className="text-slate-700">Teléfono</Label>
                <Input id="numeroTelefonico" value={formData.numeroTelefonico} onChange={handleChange} className="bg-white border-slate-200 text-slate-900" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-200 text-slate-600 bg-white">Cancelar</Button>
            <Button onClick={handleSave} className="bg-[#6C72FF] hover:bg-[#585ed6] text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader><DialogTitle className="text-rose-600">¿Eliminar alumno?</DialogTitle></DialogHeader>
          <p className="text-slate-600 text-sm">Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-slate-200 text-slate-600">Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 border-none">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}