import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface HelpGuide {
  id: string;
  title: string;
  description: string | null;
  module: string;
  content: string | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  resources?: HelpResource[];
}

export interface HelpResource {
  id: string;
  guide_id: string;
  resource_type: 'video' | 'pdf' | 'link' | 'document';
  title: string;
  url: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  thumbnail_url: string | null;
  display_order: number;
  created_at: string;
}

export interface HelpGuideVersion {
  id: string;
  guide_id: string;
  version_number: number;
  title: string;
  description: string | null;
  content: string | null;
  change_note: string | null;
  created_at: string;
  created_by: string | null;
}

export const HELP_MODULES = [
  { value: 'inicio', label: 'Inicio' },
  { value: 'animales', label: 'Animales' },
  { value: 'produccion', label: 'Producción' },
  { value: 'reproduccion', label: 'Reproducción' },
  { value: 'salud', label: 'Salud' },
  { value: 'alimentacion', label: 'Alimentación' },
  { value: 'praderas', label: 'Praderas' },
  { value: 'reportes', label: 'Reportes' },
  { value: 'simulaciones', label: 'Simulaciones' },
  { value: 'costos', label: 'Costos' },
  { value: 'configuracion', label: 'Configuración' },
] as const;

export function useHelpCenter() {
  const [guides, setGuides] = useState<HelpGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchGuides = useCallback(async (publishedOnly = true) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('help_guides')
        .select('*')
        .order('display_order', { ascending: true });

      if (publishedOnly) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch resources for each guide
      const guidesWithResources = await Promise.all(
        (data || []).map(async (guide) => {
          const { data: resources } = await supabase
            .from('help_resources')
            .select('*')
            .eq('guide_id', guide.id)
            .order('display_order', { ascending: true });

          return { ...guide, resources: resources || [] } as HelpGuide;
        })
      );

      setGuides(guidesWithResources);
    } catch (error) {
      console.error('Error fetching guides:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las guías',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createGuide = async (guide: Partial<HelpGuide>) => {
    try {
      const { data, error } = await supabase
        .from('help_guides')
        .insert({
          title: guide.title || 'Nueva Guía',
          description: guide.description || null,
          module: guide.module || 'inicio',
          content: guide.content || null,
          is_published: guide.is_published || false,
          display_order: guide.display_order || 0,
          created_by: user?.id,
          updated_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Guía creada',
        description: 'La guía se ha creado correctamente',
      });

      return data;
    } catch (error) {
      console.error('Error creating guide:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la guía',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateGuide = async (id: string, updates: Partial<HelpGuide>, changeNote?: string) => {
    try {
      // Get current guide for version history
      const { data: currentGuide } = await supabase
        .from('help_guides')
        .select('*')
        .eq('id', id)
        .single();

      if (currentGuide && changeNote) {
        // Get current version number
        const { data: versions } = await supabase
          .from('help_guide_versions')
          .select('version_number')
          .eq('guide_id', id)
          .order('version_number', { ascending: false })
          .limit(1);

        const nextVersion = (versions?.[0]?.version_number || 0) + 1;

        // Save version history
        await supabase.from('help_guide_versions').insert({
          guide_id: id,
          version_number: nextVersion,
          title: currentGuide.title,
          description: currentGuide.description,
          content: currentGuide.content,
          change_note: changeNote,
          created_by: user?.id,
        });
      }

      const { error } = await supabase
        .from('help_guides')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Guía actualizada',
        description: 'Los cambios se han guardado',
      });

      return true;
    } catch (error) {
      console.error('Error updating guide:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la guía',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteGuide = async (id: string) => {
    try {
      const { error } = await supabase
        .from('help_guides')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Guía eliminada',
        description: 'La guía se ha eliminado correctamente',
      });

      return true;
    } catch (error) {
      console.error('Error deleting guide:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la guía',
        variant: 'destructive',
      });
      return false;
    }
  };

  const addResource = async (guideId: string, resource: Partial<HelpResource>) => {
    try {
      const { data, error } = await supabase
        .from('help_resources')
        .insert({
          guide_id: guideId,
          resource_type: resource.resource_type || 'link',
          title: resource.title || 'Recurso',
          url: resource.url || null,
          file_path: resource.file_path || null,
          file_size: resource.file_size || null,
          mime_type: resource.mime_type || null,
          thumbnail_url: resource.thumbnail_url || null,
          display_order: resource.display_order || 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Recurso agregado',
        description: 'El recurso se ha agregado a la guía',
      });

      return data;
    } catch (error) {
      console.error('Error adding resource:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el recurso',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('help_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: 'Recurso eliminado',
        description: 'El recurso se ha eliminado',
      });

      return true;
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el recurso',
        variant: 'destructive',
      });
      return false;
    }
  };

  const uploadFile = async (file: File, guideId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${guideId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('help-resources')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('help-resources')
        .getPublicUrl(fileName);

      return { path: fileName, url: publicUrl };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el archivo',
        variant: 'destructive',
      });
      return null;
    }
  };

  const getVersionHistory = async (guideId: string) => {
    try {
      const { data, error } = await supabase
        .from('help_guide_versions')
        .select('*')
        .eq('guide_id', guideId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching versions:', error);
      return [];
    }
  };

  return {
    guides,
    loading,
    fetchGuides,
    createGuide,
    updateGuide,
    deleteGuide,
    addResource,
    deleteResource,
    uploadFile,
    getVersionHistory,
  };
}
