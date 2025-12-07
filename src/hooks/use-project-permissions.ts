import { useAuthContext } from 'src/auth/hooks/use-auth-context';

export function useProjectPermissions(projectManagerId?: number) {
    const { user } = useAuthContext();

    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    // Handle type mismatch (string vs number)
    const isProjectManager = user?.id && projectManagerId
        ? Number(user.id) === Number(projectManagerId)
        : false;

    const canManageSprint = isAdmin || isProjectManager;
    const canManageTasks = isAdmin || isProjectManager;
    const canManageBacklog = isAdmin || isProjectManager;

    return {
        canManageSprint,
        canManageTasks,
        canManageBacklog,
        isAdmin,
        isProjectManager,
    };
}
