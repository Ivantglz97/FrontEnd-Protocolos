import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Building2, School } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { DepartamentoService, DirectorService } from '../services/api';
import { toast } from 'sonner';

export function Departamentos() {
  const [departamentos, setDepartamentos] = useState([]);
  const [filteredDepartamentos, setFilteredDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDepartamento, setSelectedDepartamento] = useState(null);

  const session = JSON.parse(sessionStorage.getItem('usuario_ipn'));
  const userRole = session?.rol;
  const userId = session?.idUsuario;
  
  const [formData, setFormData] = useState({
    nombreDepartamento: '',
    codigo: '',
    nombreComletoJefe: '',
  });

  useEffect(() => { loadDepartamentos(); }, []);
  useEffect(() => { filterDepartamentos(); }, [searchTerm, departamentos]);

  const loadDepartamentos = async () => {
    try {
      setLoading(true);
      const response = await DepartamentoService.getAll();
      let data = response.data || [];

      if (userRole === 'ROLE_DIRECTOR') {
        try {
            const perfilRes = await DirectorService.getByIdUsuario(userId);
            const miDeptoId = perfilRes.data?.departamento?.idDepartamento;
            if (miDeptoId) {
                data = data.filter(d => (d.idDepartamento || d.id) === miDeptoId);
            } else {
                data = [];
                toast.warning('No tienes un departamento asignado.');
            }
        } catch (err) { data = []; }
      }
      setDepartamentos(data);
      setFilteredDepartamentos(data);
    } catch (error) { toast.error('Error al cargar departamentos'); } finally { setLoading(false); }
  };

  const filterDepartamentos = () => {
    const filtered = departamentos.filter(d =>
        (d.nombreDepartamento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.nombreComletoJefe || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDepartamentos(filtered);
  };

  const handleOpenDialog = (departamento) => {
    if (departamento) {
      setSelectedDepartamento(departamento);
      setFormData({
        nombreDepartamento: departamento.nombreDepartamento,
        codigo: departamento.codigo || '',
        nombreComletoJefe: departamento.nombreComletoJefe || '',
      });
    } else {
      setSelectedDepartamento(null);
      setFormData({ nombreDepartamento: '', codigo: '', nombreComletoJefe: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedDepartamento) {
        await DepartamentoService.update(selectedDepartamento.idDepartamento || selectedDepartamento.id, formData);
        toast.success('Departamento actualizado');
      } else {
        await DepartamentoService.create(formData);
        toast.success('Departamento creado');
      }
      setDialogOpen(false); loadDepartamentos();
    } catch (error) { toast.error('Error al guardar'); }
  };

  const handleDelete = async () => {
    if (!selectedDepartamento) return;
    try {
      await DepartamentoService.delete(selectedDepartamento.idDepartamento || selectedDepartamento.id);
      toast.success('Departamento eliminado');
      setDeleteDialogOpen(false); setSelectedDepartamento(null); loadDepartamentos();
    } catch (error) { toast.error('Error al eliminar'); }
  };

  const openDeleteDialog = (departamento) => {
    setSelectedDepartamento(departamento);
    setDeleteDialogOpen(true);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-[#AEB9E1]">Cargando...</div>;

  return (
    // ✅ SIN FONDO BLANCO: Se ve el fondo Dark Navy del Layout
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER: Texto Blanco para contrastar con el fondo oscuro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <div className="flex items-center gap-3 mb-1">
                <div className="bg-[#6C72FF]/20 p-2 rounded-lg text-[#6C72FF]">
                    <School className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold text-white">Departamentos</h1>
            </div>
            <p className="text-[#AEB9E1] ml-11">Gestiona las áreas académicas y sus responsables</p>
        </div>
        
        {/* 🔐 SOLO ADMIN */}
        {userRole === 'ROLE_ADMIN' && (
            <Button onClick={() => handleOpenDialog()} className="bg-[#6C72FF] hover:bg-[#585ed6] text-white shadow-lg shadow-[#6C72FF]/20 border-none">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Departamento
            </Button>
        )}
      </div>

      {/* BARRA DE BÚSQUEDA: Contenedor BLANCO para legibilidad */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
            placeholder="Buscar por nombre, código o jefe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 transition-all"
            />
        </div>
      </div>

      {/* TABLA: Contenedor BLANCO */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="text-slate-600 font-semibold w-[120px]">Código</TableHead>
              <TableHead className="text-slate-600 font-semibold">Nombre del Departamento</TableHead>
              <TableHead className="text-slate-600 font-semibold">Responsable (Jefe)</TableHead>
              {userRole === 'ROLE_ADMIN' && <TableHead className="text-right text-slate-600 font-semibold">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDepartamentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={userRole === 'ROLE_ADMIN' ? 4 : 3} className="text-center py-12 text-slate-400">
                    {userRole === 'ROLE_DIRECTOR' ? 'No tienes un departamento asignado' : 'No se encontraron departamentos'}
                </TableCell>
              </TableRow>
            ) : (
              filteredDepartamentos.map((departamento) => (
                <TableRow key={departamento.idDepartamento || departamento.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                  <TableCell className="font-mono text-indigo-600 font-medium">
                    {departamento.codigo || departamento.idDepartamento}
                  </TableCell>
                  <TableCell className="text-slate-800 font-medium">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {departamento.nombreDepartamento}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {departamento.nombreComletoJefe || <span className="text-slate-400 italic">Sin asignar</span>}
                  </TableCell>
                  
                  {userRole === 'ROLE_ADMIN' && (
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="hover:bg-indigo-50 hover:text-indigo-600 text-slate-400" onClick={() => handleOpenDialog(departamento)}>
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-rose-50 hover:text-rose-600 text-slate-400" onClick={() => openDeleteDialog(departamento)}>
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

      {/* DIÁLOGO CREAR/EDITAR (Blanco Limpio) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              {selectedDepartamento ? 'Editar Departamento' : 'Nuevo Departamento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-slate-700">Nombre</Label>
              <Input
                id="nombre"
                value={formData.nombreDepartamento}
                onChange={(e) => setFormData({ ...formData, nombreDepartamento: e.target.value })}
                className="bg-white border-slate-200 text-slate-900 focus:ring-indigo-500"
                placeholder="Ej. Formación Básica"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo" className="text-slate-700">Código</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="bg-white border-slate-200 text-slate-900"
                placeholder="Ej. DEP-FB-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsable" className="text-slate-700">Responsable</Label>
              <Input
                id="responsable"
                value={formData.nombreComletoJefe}
                onChange={(e) => setFormData({ ...formData, nombreComletoJefe: e.target.value })}
                className="bg-white border-slate-200 text-slate-900"
                placeholder="Nombre del Jefe de Departamento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-200 text-slate-600 hover:bg-slate-50 bg-white">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-[#6C72FF] hover:bg-[#585ed6] text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO ELIMINAR */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 text-sm">
            ¿Estás seguro de que deseas eliminar el departamento{' '}
            <span className="font-bold text-slate-900">{selectedDepartamento?.nombreDepartamento}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-slate-200 text-slate-600 hover:bg-slate-50 bg-white">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 border-none">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}