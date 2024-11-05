import { authStore } from '$lib/stores/auth';
import { goto } from '$app/navigation';
import { get } from 'svelte/store';

export function requireAuth() {
  const auth = get(authStore);
  if (!auth.user) {
    goto('/login');
    return false;
  }
  return true;
}
