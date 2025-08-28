import React from 'react';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ZustandDevToolsPanel } from '../ZustandDevToolsPanel';
import { useUserStore, useTodoStore, useThemeStore, useCartStore } from './stores';

// Demo component that uses all stores
function StoreDemo() {
  const userStore = useUserStore();
  const todoStore = useTodoStore();
  const themeStore = useThemeStore();
  const cartStore = useCartStore();

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Zustand DevTools Demo</h1>
      
      {/* User Store Demo */}
      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>User Store</h2>
        {userStore.user ? (
          <div>
            <p>Logged in as: {userStore.user.name} ({userStore.user.email})</p>
            <input
              type="text"
              placeholder="New name"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  userStore.updateProfile((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button onClick={userStore.logout}>Logout</button>
          </div>
        ) : (
          <div>
            <button onClick={() => userStore.login('user@example.com', 'password')}>
              Login
            </button>
          </div>
        )}
        {userStore.isLoading && <p>Loading...</p>}
        {userStore.error && <p style={{ color: 'red' }}>{userStore.error}</p>}
      </section>

      {/* Todo Store Demo */}
      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>Todo Store</h2>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Add new todo"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                if (input.value.trim()) {
                  todoStore.addTodo(input.value);
                  input.value = '';
                }
              }
            }}
          />
          <div style={{ marginTop: '10px' }}>
            Filter: 
            {['all', 'active', 'completed'].map((filter) => (
              <button
                key={filter}
                onClick={() => todoStore.setFilter(filter as any)}
                style={{
                  marginLeft: '5px',
                  fontWeight: todoStore.filter === filter ? 'bold' : 'normal',
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <ul>
          {todoStore.todos
            .filter((todo) => {
              if (todoStore.filter === 'active') return !todo.completed;
              if (todoStore.filter === 'completed') return todo.completed;
              return true;
            })
            .map((todo) => (
              <li key={todo.id} style={{ marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => todoStore.toggleTodo(todo.id)}
                />
                <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                  {todo.text}
                </span>
                <button onClick={() => todoStore.removeTodo(todo.id)} style={{ marginLeft: '10px' }}>
                  Delete
                </button>
              </li>
            ))}
        </ul>
        <button onClick={todoStore.clearCompleted}>Clear Completed</button>
      </section>

      {/* Theme Store Demo */}
      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>Theme Store</h2>
        <div>
          <label>
            Theme: 
            <select
              value={themeStore.theme}
              onChange={(e) => themeStore.setTheme(e.target.value as any)}
              style={{ marginLeft: '10px' }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </label>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>
            Primary Color: 
            <input
              type="color"
              value={themeStore.primaryColor}
              onChange={(e) => themeStore.setPrimaryColor(e.target.value)}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>
            Font Size: 
            <select
              value={themeStore.fontSize}
              onChange={(e) => themeStore.setFontSize(e.target.value as any)}
              style={{ marginLeft: '10px' }}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={themeStore.animations}
              onChange={themeStore.toggleAnimations}
            />
            Enable Animations
          </label>
        </div>
      </section>

      {/* Cart Store Demo */}
      <section style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>Shopping Cart</h2>
        <button onClick={cartStore.toggleCart}>
          {cartStore.isOpen ? 'Close' : 'Open'} Cart ({cartStore.getTotalItems()} items)
        </button>
        <div style={{ marginTop: '10px' }}>
          <h3>Add Products:</h3>
          {[
            { id: '1', name: 'T-Shirt', price: 19.99 },
            { id: '2', name: 'Jeans', price: 49.99 },
            { id: '3', name: 'Sneakers', price: 89.99 },
          ].map((product) => (
            <button
              key={product.id}
              onClick={() => cartStore.addItem(product)}
              style={{ marginRight: '10px', marginBottom: '5px' }}
            >
              Add {product.name} (${product.price})
            </button>
          ))}
        </div>
        {cartStore.isOpen && (
          <div style={{ marginTop: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <h3>Cart Items:</h3>
            {cartStore.items.length === 0 ? (
              <p>Cart is empty</p>
            ) : (
              <>
                {cartStore.items.map((item) => (
                  <div key={item.id} style={{ marginBottom: '10px' }}>
                    <span>{item.name} - ${item.price} x {item.quantity}</span>
                    <button
                      onClick={() => cartStore.updateQuantity(item.id, item.quantity - 1)}
                      style={{ marginLeft: '10px' }}
                    >
                      -
                    </button>
                    <button
                      onClick={() => cartStore.updateQuantity(item.id, item.quantity + 1)}
                      style={{ marginLeft: '5px' }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => cartStore.removeItem(item.id)}
                      style={{ marginLeft: '5px' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
                  Total: ${cartStore.getTotalPrice().toFixed(2)}
                </div>
                <button onClick={cartStore.clearCart} style={{ marginTop: '10px' }}>
                  Clear Cart
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export function App() {
  return (
    <>
      <StoreDemo />
      
      {/* TanStack DevTools with Zustand Plugin */}
      <TanStackDevtools
        plugins={[
          {
            name: 'Zustand Stores',
            render: () => <ZustandDevToolsPanel />,
          },
        ]}
      />
    </>
  );
}