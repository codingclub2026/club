import { Response, NextFunction } from 'express';
import { AdminRequest } from './requireAdmin';

type Role = 'super_admin' | 'event_manager' | 'volunteer';

const roleHierarchy: Record<Role, number> = {
  super_admin: 3,
  event_manager: 2,
  volunteer: 1,
};

/**
 * requireRole — RBAC guard. Must be used AFTER requireAdmin.
 * Checks that the admin's role meets the minimum required role level.
 */
export function requireRole(minimumRole: Role) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    const role = req.adminRole as Role | undefined;

    if (!role || !roleHierarchy[role]) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions.',
        requestId: req.requestId,
      });
      return;
    }

    if (roleHierarchy[role] < roleHierarchy[minimumRole]) {
      res.status(403).json({
        success: false,
        error: `Role '${role}' cannot perform this action. Required: ${minimumRole}.`,
        requestId: req.requestId,
      });
      return;
    }

    next();
  };
}
