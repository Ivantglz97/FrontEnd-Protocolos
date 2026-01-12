import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Users, UserCheck, 
  CheckCircle2, FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  ProtocoloService, 
  AlumnoService, 
  DirectorService, 
  ProtocoloDirectorService 
} from '../services/api'; 
import { toast } from 'sonner';

export function ProtocoloForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [alumnosCatalogo, setAlumnosCatalogo] = useState([]);
  const [directoresCatalogo, setDirectoresCatalogo] = useState([]);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    objetivos: '',
    perfilRequerido: '',
    estado: 'Pendiente',
    alumno1: 'none',
    alumno2: 'none',
    alumno3: 'none',
    alumno4: 'none',
    director1: 'none',
    director2: 'none',
  });

  useEffect(() => {
    loadCatalogs();
    if (isEditing) loadProtocoloData();
  }, [id]);

  const loadCatalogs = async () => {
    try {
      const [resAlumnos, resDirectores] = await Promise.all([
        AlumnoService.getAll(),
        DirectorService.getAll()
      ]);
      setAlumnosCatalogo((resAlumnos.data || []).filter(a => a && a.numeroBoleta));
      setDirectoresCatalogo((resDirectores.data || []).filter(d => d && d.numeroTrabajador));
    } catch (error) {
      toast.error('Error al cargar catálogos');
    }
  };

  const loadProtocoloData = async () => {
    try {
      setLoading(true);
      const [resProt, resRel] = await Promise.all([
        ProtocoloService.getById(id),
        ProtocoloDirectorService.getByProtocoloId(id)
      ]);

      const p = resProt.data;
      const asignaciones = resRel.data || [];

      if (p) {
        setFormData({
          titulo: p.titulo || '',
          descripcion: p.descripcion || '',
          objetivos: p.objetivos || '',
          perfilRequerido: p.perfilRequerido || '',
          estado: p.estado || 'Pendiente',
          alumno1: p.alumno1?.numeroBoleta?.toString() || 'none',
          alumno2: p.alumno2?.numeroBoleta?.toString() || 'none',
          alumno3: p.alumno3?.numeroBoleta?.toString() || 'none',
          alumno4: p.alumno4?.numeroBoleta?.toString() || 'none',
          director1: asignaciones[0]?.director?.numeroTrabajador?.toString() || 'none',
          director2: asignaciones[1]?.director?.numeroTrabajador?.toString() || 'none',
        });
      }
    } catch (error) {
      toast.error('Error al recuperar datos del protocolo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Función auxiliar para validar IDs y evitar NaN/Nulls
      const getValidId = (val) => {
        if (!val) return null;
        if (val === 'none') return null;
        const parsed = parseInt(val);
        return isNaN(parsed) ? null : parsed;
      };

      // 2. Construir array de directores limpio
      const directoresIds = [];
      const dir1 = getValidId(formData.director1);
      const dir2 = getValidId(formData.director2);

      if (dir1) directoresIds.push(dir1);
      if (dir2 && dir2 !== dir1) directoresIds.push(dir2);

      // 3. Helper para objetos alumno
      const buildAlumnoObj = (val) => {
        const id = getValidId(val);
        return id ? { numeroBoleta: id } : null;
      };

      const requestDTO = {
        protocolo: {
          // Si editamos, enviamos el ID explícitamente para que Spring Boot sepa qué actualizar
          idProtocolo: isEditing ? parseInt(id) : null,
          
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          objetivos: formData.objetivos,
          perfilRequerido: formData.perfilRequerido,
          estado: formData.estado,
          alumno1: buildAlumnoObj(formData.alumno1),
          alumno2: buildAlumnoObj(formData.alumno2),
          alumno3: buildAlumnoObj(formData.alumno3),
          alumno4: buildAlumnoObj(formData.alumno4),
        },
        directoresIds: directoresIds
      };

      if (isEditing) {
        await ProtocoloService.update(id, requestDTO);
        toast.success('Protocolo actualizado correctamente');
      } else {
        await ProtocoloService.create(requestDTO);
        toast.success('Protocolo creado con éxito');
      }
      navigate('/protocolos');
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error('Error al guardar cambios. Verifica los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper para renderizar selectores BLANCOS (Estilo Clean)
  const renderSelect = (label, field, catalog, idKey, nameKey, excludedIds = []) => (
    <div className="space-y-2">
      <Label className="text-slate-700 font-medium">{label}</Label>
      <Select value={formData[field]} onValueChange={(v) => handleChange(field, v)}>
        <SelectTrigger className="bg-white border-slate-200 text-slate-800 focus:ring-indigo-500">
            <SelectValue placeholder="Seleccionar..." />
        </SelectTrigger>
        <SelectContent className="bg-white border-slate-200 text-slate-800">
          <SelectItem value="none" className="text-slate-500 italic">Ninguno / Quitar</SelectItem>
          {catalog
            .filter(item => !excludedIds.includes(item[idKey]?.toString()) || formData[field] === item[idKey]?.toString())
            .map(item => (
              <SelectItem key={item[idKey].toString()} value={item[idKey].toString()} className="focus:bg-indigo-50 focus:text-indigo-900">
                {item[nameKey]} {item.apellidoPaterno || ''} ({item[idKey]})
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    // ✅ SIN altura fija (h-screen/min-h-screen) para evitar doble scroll.
    // Solo un padding inferior (pb-10) para separar el botón del borde.
    <div className="max-w-5xl mx-auto pb-10">
      
      {/* HEADER: Texto Blanco sobre fondo oscuro del Layout */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/protocolos')} className="text-slate-300 hover:bg-white/10 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
            <h1 className="text-3xl font-bold text-white">{isEditing ? 'Editar Protocolo' : 'Nuevo Protocolo'}</h1>
            <p className="text-indigo-200 text-sm mt-1">Completa la información requerida para el registro.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* TARJETA PRINCIPAL (BLANCA) */}
        <Card className="bg-white border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
                <FileText className="w-5 h-5 text-indigo-600" /> Información del Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            
            {/* Título */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Título del Protocolo <span className="text-red-500">*</span></Label>
              <Input 
                value={formData.titulo} 
                onChange={(e) => handleChange('titulo', e.target.value)} 
                required 
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-200"
                placeholder="Ingresa un título descriptivo..."
              />
            </div>

            {/* SECCIÓN DE ESTADO (ÁMBAR CLARO) */}
            {isEditing && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <Label className="flex items-center gap-2 text-amber-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Estado Actual del Proyecto
                </Label>
                <Select value={formData.estado} onValueChange={(v) => handleChange('estado', v)}>
                  <SelectTrigger className="bg-white border-amber-300 w-full md:w-1/2 text-slate-800">
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="Pendiente" className="text-amber-600 font-medium">Pendiente</SelectItem>
                    <SelectItem value="En proceso" className="text-blue-600 font-medium">En proceso</SelectItem>
                    <SelectItem value="Aprobado" className="text-emerald-600 font-medium">Aprobado</SelectItem>
                    <SelectItem value="Rechazado" className="text-rose-600 font-medium">Rechazado</SelectItem>
                    <SelectItem value="Finalizado" className="text-slate-600 font-medium">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Descripción <span className="text-red-500">*</span></Label>
                <Textarea 
                    value={formData.descripcion} 
                    onChange={(e) => handleChange('descripcion', e.target.value)} 
                    rows={5} 
                    required 
                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500"
                    placeholder="Detalla el planteamiento del problema..."
                />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Objetivos <span className="text-red-500">*</span></Label>
                    <Textarea 
                        value={formData.objetivos} 
                        onChange={(e) => handleChange('objetivos', e.target.value)} 
                        rows={2} 
                        required 
                        className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500"
                        placeholder="Objetivos generales y específicos..."
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Perfil Requerido</Label>
                    <Input 
                        value={formData.perfilRequerido} 
                        onChange={(e) => handleChange('perfilRequerido', e.target.value)} 
                        placeholder="Ej. Conocimientos en Java, React..." 
                        className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500"
                    />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Sección de Estudiantes (AZUL CLARO) */}
        <Card className="bg-sky-50 border-sky-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-sky-700">
                <Users className="w-5 h-5" /> Alumnos Participantes (Máx. 4)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderSelect("Alumno 1", "alumno1", alumnosCatalogo, "numeroBoleta", "nombre", [formData.alumno2, formData.alumno3, formData.alumno4])}
            {renderSelect("Alumno 2", "alumno2", alumnosCatalogo, "numeroBoleta", "nombre", [formData.alumno1, formData.alumno3, formData.alumno4])}
            {renderSelect("Alumno 3", "alumno3", alumnosCatalogo, "numeroBoleta", "nombre", [formData.alumno1, formData.alumno2, formData.alumno4])}
            {renderSelect("Alumno 4", "alumno4", alumnosCatalogo, "numeroBoleta", "nombre", [formData.alumno1, formData.alumno2, formData.alumno3])}
          </CardContent>
        </Card>

        {/* Sección de Directores (NARANJA CLARO) */}
        <Card className="bg-orange-50 border-orange-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                <UserCheck className="w-5 h-5" /> Directores Asignados
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderSelect("Director Titular", "director1", directoresCatalogo, "numeroTrabajador", "nombre", [formData.director2])}
            {renderSelect("Co-Director", "director2", directoresCatalogo, "numeroTrabajador", "nombre", [formData.director1])}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-6 pb-20">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/protocolos')}
            className="border-slate-500 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading} 
            className="bg-[#6C72FF] hover:bg-[#585ed6] text-white min-w-[150px] shadow-lg shadow-indigo-500/20 border-none"
          >
            <Save className="w-4 h-4 mr-2" /> {loading ? 'Guardando...' : 'Guardar Todo'}
          </Button>
        </div>
      </form>
    </div>
  );
}