import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// ユーザー情報の型定義
export interface User {
  id: string;
  email: string;
  name?: string;
}

// 認証状態の型定義
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// 初期状態
const initialState: AuthState = {
  user: null,
  isLoading: true, // 初期ローディング状態
  error: null
};

// ローカルストレージのキー
const STORAGE_KEY = 'auth_user';

// カスタムストアの作成
function createAuthStore() {
  // ローカルストレージから初期値を取得
  const savedUser = browser ? localStorage.getItem(STORAGE_KEY) : null;
  const initialUser = savedUser ? JSON.parse(savedUser) : null;

  const { subscribe, set, update } = writable<AuthState>({
    ...initialState,
    user: initialUser,
    isLoading: false
  });

  return {
    subscribe,

    // ログイン
    login: async (email: string, password: string) => {
      console.log(email, password);
      update((state) => ({ ...state, isLoading: true, error: null }));

      try {
        // ここでは仮のログイン処理（後で実際のAPI通信に置き換え）
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const user: User = {
          id: '1',
          email: email,
          name: 'テストユーザー'
        };

        // ローカルストレージに保存
        if (browser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        }

        // ストアを更新
        set({ user, isLoading: false, error: null });

        return true;
      } catch (error) {
        update((state) => ({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : '認証に失敗しました'
        }));
        return false;
      }
    },

    // ログアウト
    logout: () => {
      if (browser) {
        localStorage.removeItem(STORAGE_KEY);
      }
      set({ user: null, isLoading: false, error: null });
    },

    // エラーをクリア
    clearError: () => {
      update((state) => ({ ...state, error: null }));
    }
  };
}

// ストアをエクスポート
export const authStore = createAuthStore();
