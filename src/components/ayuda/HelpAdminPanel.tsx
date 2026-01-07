import { useState, useEffect } from 'react';
import { useFounder } from '@/contexts/FounderContext';
import { useHelpCenter, HelpGuide, HelpResource, HELP_MODULES } from '@/hooks/useHelpCenter';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Plus, Edit, Trash2, Upload, Link, Video, FileText, Eye, EyeOff, 
  GripVertical, Save, X, History, RefreshCw, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HelpAdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpAdminPanel({ open, onOpenChange }: HelpAdminPanelProps) {
  const { isFounder } = useFounder();
  const { user } = useAuth();
  const { 
    guides, 
    loading, 
    fetchGuides, 
    createGuide, 
    updateGuide, 
    deleteGuide,
    addResource,
    deleteResource,
    uploadFile,
    getVersionHistory 
  } = useHelpCenter();

  const [editingGuide, setEditingGuide] = useState<HelpGuide | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showVersions, setShowVersions] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [changeNote, setChangeNote] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module: 'inicio',
    content: '',
    is_published: false,
  });

  // Resource form state
  const [resourceForm, setResourceForm] = useState({
    type: 'link' as 'video' | 'pdf' | 'link' | 'document',
    title: '',
    url: '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (open && isFounder) {
      fetchGuides(false); // Fetch all guides including drafts
    }
  }, [open, isFounder, fetchGuides]);

  useEffect(() => {
    if (editingGuide) {
      setFormData({
        title: editingGuide.title,
        description: editingGuide.description || '',
        module: editingGuide.module,
        content: editingGuide.content || '',
        is_published: editingGuide.is_published,
      });
    } else if (isCreating) {
      setFormData({
        title: '',
        description: '',
        module: 'inicio',
        content: '',
        is_published: false,
      });
    }
  }, [editingGuide, isCreating]);

  const handleSaveGuide = async () => {
    if (editingGuide) {
      const success = await updateGuide(editingGuide.id, formData, changeNote || undefined);
      if (success) {
        setEditingGuide(null);
        setChangeNote('');
        fetchGuides(false);
      }
    } else if (isCreating) {
      const newGuide = await createGuide(formData);
      if (newGuide) {
        setIsCreating(false);
        fetchGuides(false);
      }
    }
  };

  const handleDeleteGuide = async (id: string) => {
    const success = await deleteGuide(id);
    if (success) {
      fetchGuides(false);
    }
  };

  const handleAddResource = async (guideId: string) => {
    if (!resourceForm.title) return;

    await addResource(guideId, {
      resource_type: resourceForm.type,
      title: resourceForm.title,
      url: resourceForm.url || null,
    });

    setResourceForm({ type: 'link', title: '', url: '' });
    fetchGuides(false);
  };

  const handleFileUpload = async (guideId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return;
    }

    setUploadingFile(true);
    const result = await uploadFile(file, guideId);
    
    if (result) {
      const resourceType = file.type.includes('pdf') ? 'pdf' : 
                          file.type.includes('video') ? 'video' : 'document';
      
      await addResource(guideId, {
        resource_type: resourceType,
        title: file.name,
        file_path: result.path,
        url: result.url,
        file_size: file.size,
        mime_type: file.type,
      });

      fetchGuides(false);
    }
    setUploadingFile(false);
  };

  const handleViewVersions = async (guideId: string) => {
    setShowVersions(guideId);
    const history = await getVersionHistory(guideId);
    setVersions(history);
  };

  const handleMarkAsUpdated = async (guideId: string) => {
    await updateGuide(guideId, { updated_at: new Date().toISOString() }, 'Marcado como actualizado');
    fetchGuides(false);
  };

  if (!isFounder) return null;

  const groupedGuides = HELP_MODULES.reduce((acc, module) => {
    acc[module.value] = guides.filter(g => g.module === module.value);
    return acc;
  }, {} as Record<string, HelpGuide[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-amber-500" />
            Administrar Centro de Ayuda
          </DialogTitle>
          <DialogDescription>
            Gestiona guías, videos, documentos y recursos para los usuarios
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {editingGuide || isCreating ? (
            // Edit/Create Form
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    {isCreating ? 'Nueva Guía' : 'Editar Guía'}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => { setEditingGuide(null); setIsCreating(false); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input 
                      value={formData.title}
                      onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                      placeholder="Título de la guía"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Módulo</Label>
                    <Select 
                      value={formData.module} 
                      onValueChange={(v) => setFormData(p => ({ ...p, module: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HELP_MODULES.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción corta</Label>
                  <Textarea 
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Breve descripción de la guía"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contenido</Label>
                  <Textarea 
                    value={formData.content}
                    onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
                    placeholder="Contenido detallado de la guía (opcional)"
                    rows={4}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Switch 
                    checked={formData.is_published}
                    onCheckedChange={(v) => setFormData(p => ({ ...p, is_published: v }))}
                  />
                  <Label>Publicada (visible para usuarios)</Label>
                </div>

                {editingGuide && (
                  <>
                    <div className="space-y-2">
                      <Label>Nota de cambio (opcional)</Label>
                      <Input 
                        value={changeNote}
                        onChange={(e) => setChangeNote(e.target.value)}
                        placeholder="Describe brevemente el cambio realizado"
                      />
                    </div>

                    {/* Resources Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Recursos adjuntos</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {editingGuide.resources?.map(resource => (
                          <div key={resource.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              {resource.resource_type === 'video' && <Video className="h-4 w-4 text-blue-500" />}
                              {resource.resource_type === 'pdf' && <FileText className="h-4 w-4 text-red-500" />}
                              {resource.resource_type === 'link' && <Link className="h-4 w-4 text-green-500" />}
                              {resource.resource_type === 'document' && <FileText className="h-4 w-4 text-orange-500" />}
                              <span className="text-sm">{resource.title}</span>
                            </div>
                            <div className="flex gap-1">
                              {resource.url && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-destructive"
                                onClick={() => deleteResource(resource.id).then(() => fetchGuides(false))}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Add resource form */}
                        <div className="border-t pt-3 space-y-2">
                          <Label className="text-xs">Agregar recurso</Label>
                          <div className="flex gap-2">
                            <Select 
                              value={resourceForm.type} 
                              onValueChange={(v: any) => setResourceForm(p => ({ ...p, type: v }))}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="link">Link</SelectItem>
                                <SelectItem value="document">Documento</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input 
                              value={resourceForm.title}
                              onChange={(e) => setResourceForm(p => ({ ...p, title: e.target.value }))}
                              placeholder="Título"
                              className="flex-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Input 
                              value={resourceForm.url}
                              onChange={(e) => setResourceForm(p => ({ ...p, url: e.target.value }))}
                              placeholder="URL (YouTube, Vimeo, Drive, etc.)"
                              className="flex-1"
                            />
                            <Button size="sm" onClick={() => handleAddResource(editingGuide.id)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">o</span>
                            <Label className="cursor-pointer">
                              <Input 
                                type="file" 
                                className="hidden"
                                accept=".pdf,.doc,.docx,.mp4,.webm"
                                onChange={(e) => handleFileUpload(editingGuide.id, e)}
                                disabled={uploadingFile}
                              />
                              <Button variant="outline" size="sm" disabled={uploadingFile} asChild>
                                <span>
                                  <Upload className="h-4 w-4 mr-1" />
                                  {uploadingFile ? 'Subiendo...' : 'Subir archivo'}
                                </span>
                              </Button>
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => { setEditingGuide(null); setIsCreating(false); }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveGuide}>
                    <Save className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                </div>
              </div>
            </ScrollArea>
          ) : showVersions ? (
            // Version History View
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historial de versiones
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowVersions(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {versions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay versiones anteriores
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Versión</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Nota de cambio</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {versions.map(v => (
                        <TableRow key={v.id}>
                          <TableCell>v{v.version_number}</TableCell>
                          <TableCell>{v.title}</TableCell>
                          <TableCell>{v.change_note || '-'}</TableCell>
                          <TableCell>{format(new Date(v.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </ScrollArea>
          ) : (
            // Guides List
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {guides.length} guías en total
                  </p>
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nueva Guía
                  </Button>
                </div>

                <Tabs defaultValue="all">
                  <TabsList className="flex-wrap h-auto gap-1">
                    <TabsTrigger value="all">Todas</TabsTrigger>
                    {HELP_MODULES.map(m => (
                      <TabsTrigger key={m.value} value={m.value} className="text-xs">
                        {m.label}
                        {groupedGuides[m.value]?.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {groupedGuides[m.value].length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="all" className="mt-4 space-y-2">
                    {guides.map(guide => (
                      <GuideRow 
                        key={guide.id} 
                        guide={guide} 
                        onEdit={() => setEditingGuide(guide)}
                        onDelete={() => handleDeleteGuide(guide.id)}
                        onViewVersions={() => handleViewVersions(guide.id)}
                        onMarkUpdated={() => handleMarkAsUpdated(guide.id)}
                      />
                    ))}
                  </TabsContent>

                  {HELP_MODULES.map(m => (
                    <TabsContent key={m.value} value={m.value} className="mt-4 space-y-2">
                      {groupedGuides[m.value]?.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No hay guías en este módulo
                        </p>
                      ) : (
                        groupedGuides[m.value]?.map(guide => (
                          <GuideRow 
                            key={guide.id} 
                            guide={guide} 
                            onEdit={() => setEditingGuide(guide)}
                            onDelete={() => handleDeleteGuide(guide.id)}
                            onViewVersions={() => handleViewVersions(guide.id)}
                            onMarkUpdated={() => handleMarkAsUpdated(guide.id)}
                          />
                        ))
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GuideRow({ 
  guide, 
  onEdit, 
  onDelete, 
  onViewVersions,
  onMarkUpdated 
}: { 
  guide: HelpGuide; 
  onEdit: () => void; 
  onDelete: () => void;
  onViewVersions: () => void;
  onMarkUpdated: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{guide.title}</span>
            <Badge variant={guide.is_published ? 'default' : 'secondary'} className="text-xs">
              {guide.is_published ? 'Publicada' : 'Borrador'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {HELP_MODULES.find(m => m.value === guide.module)?.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Actualizado: {format(new Date(guide.updated_at), 'dd/MM/yyyy', { locale: es })}
            {guide.resources && guide.resources.length > 0 && (
              <span className="ml-2">• {guide.resources.length} recurso(s)</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMarkUpdated} title="Marcar como actualizado">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onViewVersions} title="Ver historial">
          <History className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar guía?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminarán también todos los recursos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
