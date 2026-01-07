-- Create help_guides table
CREATE TABLE public.help_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  content TEXT,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Create help_resources table (videos, PDFs, links per guide)
CREATE TABLE public.help_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id UUID NOT NULL REFERENCES public.help_guides(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'video', 'pdf', 'link', 'document'
  title TEXT NOT NULL,
  url TEXT, -- For external links (YouTube, Vimeo, Drive)
  file_path TEXT, -- For uploaded files
  file_size INTEGER,
  mime_type TEXT,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create help_guide_versions table for version history
CREATE TABLE public.help_guide_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id UUID NOT NULL REFERENCES public.help_guides(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  change_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS on all tables
ALTER TABLE public.help_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_guide_versions ENABLE ROW LEVEL SECURITY;

-- Help guides policies: everyone can read published, founders can manage all
CREATE POLICY "Anyone can view published guides"
ON public.help_guides FOR SELECT
USING (is_published = true);

CREATE POLICY "Founders can view all guides"
ON public.help_guides FOR SELECT
USING (public.is_founder(auth.uid()));

CREATE POLICY "Founders can insert guides"
ON public.help_guides FOR INSERT
WITH CHECK (public.is_founder(auth.uid()));

CREATE POLICY "Founders can update guides"
ON public.help_guides FOR UPDATE
USING (public.is_founder(auth.uid()));

CREATE POLICY "Founders can delete guides"
ON public.help_guides FOR DELETE
USING (public.is_founder(auth.uid()));

-- Help resources policies
CREATE POLICY "Anyone can view resources of published guides"
ON public.help_resources FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.help_guides 
  WHERE id = guide_id AND is_published = true
));

CREATE POLICY "Founders can view all resources"
ON public.help_resources FOR SELECT
USING (public.is_founder(auth.uid()));

CREATE POLICY "Founders can insert resources"
ON public.help_resources FOR INSERT
WITH CHECK (public.is_founder(auth.uid()));

CREATE POLICY "Founders can update resources"
ON public.help_resources FOR UPDATE
USING (public.is_founder(auth.uid()));

CREATE POLICY "Founders can delete resources"
ON public.help_resources FOR DELETE
USING (public.is_founder(auth.uid()));

-- Help versions policies
CREATE POLICY "Founders can view all versions"
ON public.help_guide_versions FOR SELECT
USING (public.is_founder(auth.uid()));

CREATE POLICY "Founders can insert versions"
ON public.help_guide_versions FOR INSERT
WITH CHECK (public.is_founder(auth.uid()));

-- Create storage bucket for help resources
INSERT INTO storage.buckets (id, name, public) 
VALUES ('help-resources', 'help-resources', true);

-- Storage policies for help resources
CREATE POLICY "Anyone can view help resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'help-resources');

CREATE POLICY "Founders can upload help resources"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'help-resources' AND public.is_founder(auth.uid()));

CREATE POLICY "Founders can update help resources"
ON storage.objects FOR UPDATE
USING (bucket_id = 'help-resources' AND public.is_founder(auth.uid()));

CREATE POLICY "Founders can delete help resources"
ON storage.objects FOR DELETE
USING (bucket_id = 'help-resources' AND public.is_founder(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_help_guides_updated_at
BEFORE UPDATE ON public.help_guides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();