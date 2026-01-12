import { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, Mail, Search, Filter, UserCog, Pencil, Lock, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { UsuarioService } from '../services/api';
import { toast } from 'sonner';

export function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('TODOS');
  
  const [formData, setFormData] = useState({ email: '', contrasena: '', rol: 'ROLE_USER' });

  useEffect(() => { loadUsuarios(); }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const res = await UsuarioService.getAll();
      setUsuarios(res.data || []);
    } catch (error) { toast.error('Error al cargar usuarios'); } 
    finally { setLoading(false); }
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'TODOS' || u.rol === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [usuarios, searchTerm, roleFilter]);

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData({ email: '', contrasena: '', rol: 'ROLE_USER' });
    setDialogOpen(true);
  };

  const openEditDialog = (usuario) => {
    setEditingId(usuario.idUsuario);
    setFormData({ email: usuario.email, contrasena: '', rol: usuario.rol });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await UsuarioService.update(editingId, formData);
        toast.success('Usuario actualizado correctamente');
      } else {
        await UsuarioService.create(formData);
        toast.success('Cuenta de usuario creada');
      }
      setDialogOpen(false);
      loadUsuarios();
    } catch (error) {
      toast.error(editingId ? 'Error al actualizar' : 'Error al crear. Verifica los datos.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar usuario permanentemente?')) return;
    try {
      await UsuarioService.delete(id);
      toast.success('Usuario eliminado');
      loadUsuarios();
    } catch (error) { toast.error('Error al eliminar'); }
  };

  const getRoleBadge = (rol) => {
    switch (rol) {
      case 'ROLE_ADMIN': return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Administrador</Badge>;
      case 'ROLE_DIRECTOR': return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Director</Badge>;
      default: return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">Alumno</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER: Texto claro sobre fondo oscuro */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
             <Shield className="w-8 h-8 text-indigo-500" /> Gestión de Cuentas
          </h1>
          <p className="text-slate-400 text-sm ml-10">Control de acceso y roles de usuario del sistema</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 border-none">
          <Plus className="w-4 h-4 mr-2" /> Nueva Cuenta
        </Button>
      </div>

      {/* BARRA DE FILTROS (BLANCA) */}
      <Card className="p-4 shadow-sm border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Buscar por email..." 
              className="pl-10 bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:border-indigo-500 transition-all" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 min-w-[200px]">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="bg-white border-slate-200 text-slate-700">
                <SelectValue placeholder="Filtrar por Rol" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="TODOS">Todos los Roles</SelectItem>
                <SelectItem value="ROLE_USER">Alumnos</SelectItem>
                <SelectItem value="ROLE_DIRECTOR">Directores</SelectItem>
                <SelectItem value="ROLE_ADMIN">Administradores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* TABLA DE USUARIOS (BLANCA) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow>
              <TableHead className="font-bold text-slate-600">Email / Usuario</TableHead>
              <TableHead className="font-bold text-slate-600">Rol del Sistema</TableHead>
              <TableHead className="font-bold text-slate-600">Fecha de Creación</TableHead>
              <TableHead className="text-right font-bold text-slate-600">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-400">Cargando usuarios...</TableCell></TableRow>
            ) : usuariosFiltrados.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-400">No se encontraron usuarios coincidentes</TableCell></TableRow>
            ) : (
              usuariosFiltrados.map((u) => (
                <TableRow key={u.idUsuario} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 p-2 rounded-full text-indigo-600"><Mail className="w-4 h-4"/></div>
                      <span className="text-slate-700">{u.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(u.rol)}</TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(u.fechaCreacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                            onClick={() => openEditDialog(u)}
                        >
                            <Pencil className="w-4 h-4"/>
                        </Button>
                        <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleDelete(u.idUsuario)}
                        >
                            <Trash2 className="w-4 h-4"/>
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* DIALOGO (BLANCO LIMPIO) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
                <UserCog className="w-5 h-5 text-indigo-600" /> 
                {editingId ? 'Editar Usuario' : 'Crear Nueva Cuenta'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Correo Institucional</Label>
              <Input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                placeholder="ejemplo@ipn.mx" 
                className="bg-white border-slate-200 text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">
                  {editingId ? 'Nueva Contraseña (Opcional)' : 'Contraseña Provisional'}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    type="password" 
                    value={formData.contrasena} 
                    onChange={(e) => setFormData({...formData, contrasena: e.target.value})} 
                    placeholder={editingId ? "Dejar vacío para mantener la actual" : "********"}
                    className="pl-9 bg-white border-slate-200 text-slate-900"
                />
              </div>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 space-y-2">
              <Label className="text-indigo-900 font-medium">Nivel de Privilegios</Label>
              <Select value={formData.rol} onValueChange={(val) => setFormData({...formData, rol: val})}>
                <SelectTrigger className="bg-white border-indigo-200 text-indigo-900"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="ROLE_USER">Alumno (Acceso Básico)</SelectItem>
                  <SelectItem value="ROLE_DIRECTOR">Director (Gestión Parcial)</SelectItem>
                  <SelectItem value="ROLE_ADMIN">Administrador (Acceso Total)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-200 text-slate-600 bg-white hover:bg-slate-50">Cancelar</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {editingId ? 'Guardar Cambios' : 'Generar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}