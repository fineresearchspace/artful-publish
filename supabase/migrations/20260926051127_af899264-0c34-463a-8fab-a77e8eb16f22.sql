INSERT INTO public.categories (name, slug, description, sort_order)
VALUES (
  'CFA Exam',
  'cfa-exam',
  'CFA exam basics, curriculum, study planning, registration and candidate guidance.',
  COALESCE((SELECT MAX(sort_order) + 1 FROM public.categories), 1)
)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;