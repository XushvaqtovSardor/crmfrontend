const ROLE_ALIASES = {
    MANAGER: 'MANAGEMENT',
    ADMINISTRATOR: 'ADMINSTRATOR',
    STAFF: 'ADMINSTRATOR',
};

export const STAFF_ROLES = ['SUPERADMIN', 'ADMIN', 'MANAGEMENT', 'ADMINSTRATOR'];

export function normalizeRole(role) {
    const normalized = String(role || '').trim().toUpperCase();
    return ROLE_ALIASES[normalized] || normalized;
}

export function isStaffRole(role) {
    return STAFF_ROLES.includes(normalizeRole(role));
}

export function isRoleAllowed(role, allowedRoles = []) {
    if (!allowedRoles || allowedRoles.length === 0) {
        return true;
    }

    const normalizedRole = normalizeRole(role);
    return allowedRoles.map(normalizeRole).includes(normalizedRole);
}

export function getDefaultRouteByRole(role) {
    const normalizedRole = normalizeRole(role);

    if (normalizedRole === 'TEACHER') {
        return '/dashboard';
    }

    if (normalizedRole === 'STUDENT') {
        return '/dashboard';
    }

    if (isStaffRole(normalizedRole)) {
        return '/dashboard';
    }

    return '/unauthorized';
}
