import React, { useState } from 'react';
import { BrowserAutomationPanel } from '@sucoza/browser-automation-test-recorder-devtools-plugin';

function App() {
  const [devToolsVisible, setDevToolsVisible] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    newsletter: false,
  });
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', completed: false },
    { id: 2, text: 'Build awesome apps', completed: true },
    { id: 3, text: 'Test automation', completed: false },
  ]);
  const [newTodo, setNewTodo] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Form submitted!\nName: ${formData.name}\nEmail: ${formData.email}\nMessage: ${formData.message}\nNewsletter: ${formData.newsletter}`);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
      }]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Main Application */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <header style={{ marginBottom: '30px' }}>
          <h1>Browser Automation Test Recorder - Example App</h1>
          <p>This example application demonstrates various UI interactions for testing the recorder plugin.</p>
          
          <button
            onClick={() => setDevToolsVisible(!devToolsVisible)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {devToolsVisible ? 'Hide' : 'Show'} DevTools
          </button>
        </header>

        {/* Contact Form */}
        <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>Contact Form</h2>
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label htmlFor="name">Name:</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="message">Message:</label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={{ width: '100%', height: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px', resize: 'vertical' }}
                placeholder="Enter your message"
              />
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={formData.newsletter}
                  onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Subscribe to newsletter
              </label>
            </div>

            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Submit Form
            </button>
          </form>
        </section>

        {/* Todo List */}
        <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>Todo List</h2>
          
          <form onSubmit={handleAddTodo} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo..."
              style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Add Todo
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {todos.map(todo => (
              <div
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px',
                  border: '1px solid #e1e5e9',
                  borderRadius: '4px',
                  backgroundColor: todo.completed ? '#f8f9fa' : 'white',
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  style={{ cursor: 'pointer' }}
                />
                <span
                  style={{
                    flex: 1,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? '#6c757d' : 'inherit',
                  }}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Elements */}
        <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>Interactive Elements</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
            <button
              onClick={() => alert('Button clicked!')}
              style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Click Me
            </button>

            <button
              onDoubleClick={() => alert('Button double-clicked!')}
              style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Double Click Me
            </button>

            <select
              onChange={(e) => alert(`Selected: ${e.target.value}`)}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="">Choose an option</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>

            <input
              type="range"
              min="0"
              max="100"
              defaultValue="50"
              style={{ width: '150px' }}
            />

            <input
              type="color"
              defaultValue="#ff6b6b"
              style={{ width: '50px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            />
          </div>
        </section>

        {/* Navigation Links */}
        <section style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>Navigation</h2>
          <div style={{ display: 'flex', gap: '15px' }}>
            <a href="#section1" style={{ color: '#007bff', textDecoration: 'none' }}>Section 1</a>
            <a href="#section2" style={{ color: '#007bff', textDecoration: 'none' }}>Section 2</a>
            <a href="https://example.com" target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none' }}>
              External Link
            </a>
          </div>
        </section>
      </div>

      {/* DevTools Panel */}
      {devToolsVisible && (
        <div style={{ 
          width: '400px', 
          borderLeft: '1px solid #e1e5e9',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <BrowserAutomationPanel
            theme="auto"
            compact={false}
            defaultTab="recorder"
            onTabChange={(tab) => console.log('Tab changed to:', tab)}
            onEvent={(event) => console.log('Event:', event)}
          />
        </div>
      )}
    </div>
  );
}

export default App;