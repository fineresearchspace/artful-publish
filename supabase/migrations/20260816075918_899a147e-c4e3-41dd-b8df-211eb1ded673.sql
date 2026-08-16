
REVOKE ALL ON FUNCTION public.grant_first_user_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.increment_article_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_article_view(text) TO anon, authenticated;
