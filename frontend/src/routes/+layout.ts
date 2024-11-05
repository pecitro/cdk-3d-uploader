export const ssr = false;
export const prerender = true;

import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';

export const load: LayoutLoad = async () => {
  const auth = get(authStore);

  if (false) {
    // if (!auth.user) {
    throw redirect(307, '/login');
  }

  return {};
};
