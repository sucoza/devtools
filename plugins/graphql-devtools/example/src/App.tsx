import React from 'react';
import { GraphQLDevToolsPanel } from '../../src';  // Import from parent project
import { GraphQLClient } from './GraphQLClient';

const client = new GraphQLClient();

// Sample queries for testing
const SAMPLE_QUERIES = {
  GET_USERS: `
    query GetUsers($limit: Int, $offset: Int) {
      users(limit: $limit, offset: $offset) {
        id
        name
        email
        posts(limit: 5) {
          id
          title
          publishedAt
          tags
        }
      }
    }
  `,
  
  GET_USER: `
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
        posts {
          id
          title
          content
          publishedAt
          tags
        }
      }
    }
  `,
  
  GET_POSTS: `
    query GetPosts($limit: Int, $authorId: ID) {
      posts(limit: $limit, authorId: $authorId) {
        id
        title
        content
        publishedAt
        tags
        author {
          id
          name
          email
        }
      }
    }
  `,
  
  CREATE_USER: `
    mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        id
        name
        email
      }
    }
  `,
  
  CREATE_POST: `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        id
        title
        content
        publishedAt
        tags
        author {
          id
          name
        }
      }
    }
  `
};

function App() {
  const [isDevToolsOpen, setIsDevToolsOpen] = React.useState(true);
  const [users, setUsers] = React.useState<any[]>([]);
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const executeQuery = async (queryName: keyof typeof SAMPLE_QUERIES, variables?: any) => {
    setLoading(true);
    try {
      const result = await client.query(SAMPLE_QUERIES[queryName], variables);
      
      if (result.data.users) {
        setUsers(result.data.users);
      }
      if (result.data.posts) {
        setPosts(result.data.posts);
      }
      if (result.data.user) {
        setUsers([result.data.user]);
      }
      
      console.log('GraphQL Result:', result);
    } catch (error) {
      console.error('GraphQL Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeMutation = async (mutationName: keyof typeof SAMPLE_QUERIES, variables: any) => {
    setLoading(true);
    try {
      const result = await client.mutate(SAMPLE_QUERIES[mutationName], variables);
      console.log('Mutation Result:', result);
      
      // Refresh data after mutation
      if (mutationName === 'CREATE_USER') {
        await executeQuery('GET_USERS');
      }
      if (mutationName === 'CREATE_POST') {
        await executeQuery('GET_POSTS');
      }
    } catch (error) {
      console.error('Mutation Error:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // Load initial data
    executeQuery('GET_USERS');
    executeQuery('GET_POSTS');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                GraphQL DevTools Demo
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Test the GraphQL DevTools Enhanced plugin with sample queries
              </p>
            </div>
            
            <button
              onClick={() => setIsDevToolsOpen(!isDevToolsOpen)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {isDevToolsOpen ? 'Hide' : 'Show'} DevTools
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Sample Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Sample Actions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => executeQuery('GET_USERS', { limit: 10 })}
                  disabled={loading}
                  className="p-3 border border-blue-200 rounded-md hover:bg-blue-50 text-left disabled:opacity-50"
                >
                  <div className="font-medium text-blue-900">Get Users</div>
                  <div className="text-sm text-blue-600">Fetch all users with their posts</div>
                </button>
                
                <button
                  onClick={() => executeQuery('GET_USER', { id: '1' })}
                  disabled={loading}
                  className="p-3 border border-green-200 rounded-md hover:bg-green-50 text-left disabled:opacity-50"
                >
                  <div className="font-medium text-green-900">Get User by ID</div>
                  <div className="text-sm text-green-600">Fetch user with ID = 1</div>
                </button>
                
                <button
                  onClick={() => executeQuery('GET_POSTS', { limit: 10 })}
                  disabled={loading}
                  className="p-3 border border-purple-200 rounded-md hover:bg-purple-50 text-left disabled:opacity-50"
                >
                  <div className="font-medium text-purple-900">Get Posts</div>
                  <div className="text-sm text-purple-600">Fetch all posts with authors</div>
                </button>
                
                <button
                  onClick={() => executeMutation('CREATE_USER', { 
                    input: { name: 'New User', email: 'new@example.com' }
                  })}
                  disabled={loading}
                  className="p-3 border border-orange-200 rounded-md hover:bg-orange-50 text-left disabled:opacity-50"
                >
                  <div className="font-medium text-orange-900">Create User</div>
                  <div className="text-sm text-orange-600">Create a new user</div>
                </button>
                
                <button
                  onClick={() => executeMutation('CREATE_POST', { 
                    input: { 
                      title: 'New Post', 
                      content: 'This is a test post',
                      authorId: '1',
                      tags: ['test', 'demo']
                    }
                  })}
                  disabled={loading}
                  className="p-3 border border-red-200 rounded-md hover:bg-red-50 text-left disabled:opacity-50"
                >
                  <div className="font-medium text-red-900">Create Post</div>
                  <div className="text-sm text-red-600">Create a new post</div>
                </button>
                
                <button
                  onClick={() => {
                    // Trigger an error
                    client.query('invalid query {}');
                  }}
                  disabled={loading}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 text-left disabled:opacity-50"
                >
                  <div className="font-medium text-gray-900">Trigger Error</div>
                  <div className="text-sm text-gray-600">Execute invalid query</div>
                </button>
              </div>
            </div>

            {/* Data Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Users ({users.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-md p-3">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      {user.posts && user.posts.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {user.posts.length} posts
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Posts */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Posts ({posts.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {posts.map((post) => (
                    <div key={post.id} className="border rounded-md p-3">
                      <div className="font-medium">{post.title}</div>
                      {post.author && (
                        <div className="text-sm text-gray-600">
                          by {post.author.name}
                        </div>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {post.tags.map((tag: string, index: number) => (
                            <span key={index} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                How to Use
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>1. Click the "Show DevTools" button to open the GraphQL DevTools panel</p>
                <p>2. Use the sample actions above to trigger GraphQL operations</p>
                <p>3. Watch the operations appear in the DevTools "Operations" tab</p>
                <p>4. Explore the schema in the "Schema" tab</p>
                <p>5. Build queries visually in the "Query Builder" tab</p>
                <p>6. Monitor performance metrics across all tabs</p>
              </div>
            </div>
          </div>
        </div>

        {/* DevTools Panel */}
        {isDevToolsOpen && (
          <div className="w-1/2 border-l border-gray-200 bg-white">
            <div className="h-screen overflow-hidden">
              <GraphQLDevToolsPanel />
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Executing GraphQL operation...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;