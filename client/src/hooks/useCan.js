import { useAuth } from './useAuth.js';

export function useCan(module, action = 'canView') {
  const { permissions } = useAuth();
  return permissions[module]?.[action] === true;
}