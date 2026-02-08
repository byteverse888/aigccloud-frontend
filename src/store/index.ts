import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ UI Store ============

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state: UIState) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
    }),
    { name: 'ui-storage' }
  )
);

// ============ Auth Store ============

interface User {
  objectId: string;
  sessionToken?: string;  // Parse session token (for Parse API)
  jwtToken?: string;      // JWT token (for backend API)
  username: string;
  email: string;
  phone?: string;
  role: string;
  level: number;
  memberLevel: 'normal' | 'vip' | 'svip';
  memberExpireAt?: string | Date;
  web3Address?: string;
  inviteCount: number;
  successRegCount: number;
  totalIncentive: number;
  avatar?: string;
  avatarKey?: string; // S3 文件 key
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user: User | null) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
    }),
    { name: 'auth-storage' }
  )
);

// ============ Cart Store ============

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item: Omit<CartItem, 'id'>) => set((state: CartState) => {
        const existing = state.items.find((i: CartItem) => i.productId === item.productId);
        if (existing) {
          return { items: state.items.map((i: CartItem) => i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i) };
        }
        return { items: [...state.items, { ...item, id: Math.random().toString(36).substring(2, 15) }] };
      }),
      removeItem: (id: string) => set((state: CartState) => ({ items: state.items.filter((item: CartItem) => item.id !== id) })),
      updateQuantity: (id: string, quantity: number) => set((state: CartState) => ({ items: state.items.map((item: CartItem) => item.id === id ? { ...item, quantity } : item) })),
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => {
        const state = get() as CartState;
        return state.items.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);
      },
      getTotalItems: () => {
        const state = get() as CartState;
        return state.items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
      },
    }),
    { name: 'cart-storage' }
  )
);

// ============ AI Creation Store ============

type TaskStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

interface AITask {
  id: string;
  type: string;
  status: TaskStatus;
  result?: string;
  error?: string;
}

interface AICreationState {
  currentTask: AITask | null;
  setCurrentTask: (task: AITask | null) => void;
  updateStatus: (status: TaskStatus, result?: string, error?: string) => void;
}

export const useAICreationStore = create<AICreationState>()((set) => ({
  currentTask: null,
  setCurrentTask: (task: AITask | null) => set(() => ({ currentTask: task })),
  updateStatus: (status: TaskStatus, result?: string, error?: string) => set((state: AICreationState) => ({
    currentTask: state.currentTask ? { ...state.currentTask, status, result, error } : null,
  })),
}));

// ============ Wallet Store (仅内存，不持久化) ============

interface WalletState {
  privateKey: string | null;  // 私钥（仅内存，不持久化）
  walletType: 'metamask' | 'privateKey' | 'mnemonic' | null;  // 登录方式
  setPrivateKey: (privateKey: string | null) => void;
  setWalletType: (type: 'metamask' | 'privateKey' | 'mnemonic' | null) => void;
  clearWallet: () => void;
}

// 注意：不使用 persist，私钥仅保存在内存中，刷新页面后会清除
export const useWalletStore = create<WalletState>()((set) => ({
  privateKey: null,
  walletType: null,
  setPrivateKey: (privateKey: string | null) => set({ privateKey }),
  setWalletType: (walletType: 'metamask' | 'privateKey' | 'mnemonic' | null) => set({ walletType }),
  clearWallet: () => set({ privateKey: null, walletType: null }),
}));
