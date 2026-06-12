import type { UserRole } from './types';

const SELECTED_ROLE_KEY = 'reviewx_selected_role';

export function saveSelectedRole(role: UserRole) {
  window.localStorage.setItem(SELECTED_ROLE_KEY, role);
}

export function clearSelectedRole() {
  window.localStorage.removeItem(SELECTED_ROLE_KEY);
}
