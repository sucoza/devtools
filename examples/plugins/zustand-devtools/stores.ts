import { create } from 'zustand';
import { createDevToolsStore, devtoolsMiddleware } from '../zustandDevtoolsIntegration';

// Example 1: User Store
interface UserState {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string) => void;
}

export const useUserStore = createDevToolsStore(
  'UserStore',
  () => create<UserState>()(
    devtoolsMiddleware((set) => ({
      user: null,
      isLoading: false,
      error: null,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        set({
          user: {
            id: '123',
            name: 'John Doe',
            email: email,
          },
          isLoading: false,
        });
      },
      
      logout: () => {
        set({ user: null, error: null });
      },
      
      updateProfile: (name: string) => {
        set((state) => ({
          user: state.user ? { ...state.user, name } : null,
        }));
      },
    }))
  )
);

// Example 2: Todo Store
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  setFilter: (filter: TodoState['filter']) => void;
  clearCompleted: () => void;
}

export const useTodoStore = createDevToolsStore(
  'TodoStore',
  () => create<TodoState>()(
    devtoolsMiddleware((set) => ({
      todos: [
        { id: '1', text: 'Learn Zustand', completed: true, createdAt: new Date() },
        { id: '2', text: 'Build DevTools Plugin', completed: false, createdAt: new Date() },
      ],
      filter: 'all',
      
      addTodo: (text: string) => {
        const newTodo: Todo = {
          id: Date.now().toString(),
          text,
          completed: false,
          createdAt: new Date(),
        };
        set((state) => ({
          todos: [...state.todos, newTodo],
        }));
      },
      
      toggleTodo: (id: string) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          ),
        }));
      },
      
      removeTodo: (id: string) => {
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        }));
      },
      
      setFilter: (filter: TodoState['filter']) => {
        set({ filter });
      },
      
      clearCompleted: () => {
        set((state) => ({
          todos: state.todos.filter((todo) => !todo.completed),
        }));
      },
    }))
  )
);

// Example 3: Theme Store
interface ThemeState {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  setTheme: (theme: ThemeState['theme']) => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: ThemeState['fontSize']) => void;
  toggleAnimations: () => void;
}

export const useThemeStore = createDevToolsStore(
  'ThemeStore',
  () => create<ThemeState>()(
    devtoolsMiddleware((set) => ({
      theme: 'light',
      primaryColor: '#007bff',
      fontSize: 'medium',
      animations: true,
      
      setTheme: (theme) => set({ theme }),
      setPrimaryColor: (primaryColor) => set({ primaryColor }),
      setFontSize: (fontSize) => set({ fontSize }),
      toggleAnimations: () => set((state) => ({ animations: !state.animations })),
    }))
  )
);

// Example 4: Shopping Cart Store
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = createDevToolsStore(
  'ShoppingCartStore',
  () => create<CartState>()(
    devtoolsMiddleware((set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        });
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
        } else {
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, quantity } : item
            ),
          }));
        }
      },
      
      clearCart: () => set({ items: [] }),
      
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }))
  )
);