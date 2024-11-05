<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { LoaderCircle } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';

  let email = '';
  let password = '';
  let isLoading = false;
  let errorMessage = '';

  async function handleSubmit() {
    errorMessage = '';
    isLoading = true;

    try {
      if (email && password) {
        // 認証成功時の処理
        // ここで実際の認証処理を行う（今はモック）
        const success = await authStore.login(email, password);
        if (success) {
          goto('/'); // ホームページへリダイレクト
        }
      } else {
        throw new Error('メールアドレスとパスワードを入力してください。');
      }
    } catch (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'ログインに失敗しました。';
      }
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="flex min-h-screen flex-col justify-center bg-gray-200 py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <h1 class="mt-6 text-center text-3xl font-bold text-gray-900">Image Gallery</h1>
    <h2 class="mt-6 text-center text-xl text-gray-900">アカウントにログイン</h2>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
      <form class="space-y-6" on:submit|preventDefault={handleSubmit}>
        <!-- メールアドレス入力 -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            メールアドレス
          </label>
          <div class="mt-1">
            <input
              id="email"
              type="email"
              required
              class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              bind:value={email}
              autocomplete="email"
            />
          </div>
        </div>

        <!-- パスワード入力 -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700"> パスワード </label>
          <div class="mt-1">
            <input
              id="password"
              type="password"
              required
              class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              bind:value={password}
              autocomplete="current-password"
            />
          </div>
        </div>

        <!-- ログインボタン -->
        <div>
          <button
            type="submit"
            class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            {#if isLoading}
              <LoaderCircle class="-ml-1 mr-3 h-5 w-5 animate-spin" />
              <slot name="loading">ログイン中...</slot>
            {:else}
              ログイン
            {/if}
          </button>
        </div>

        <!-- エラーメッセージ -->
        {#if errorMessage}
          <div class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  {errorMessage}
                </h3>
              </div>
            </div>
          </div>
        {/if}
      </form>
    </div>
  </div>
</div>
