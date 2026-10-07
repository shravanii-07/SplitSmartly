REVOKE EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_group_owner(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_group_owner(UUID, UUID) TO authenticated, service_role;