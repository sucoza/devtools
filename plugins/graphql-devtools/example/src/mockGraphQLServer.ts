// Mock GraphQL server for demo purposes
export const mockSchema = {
  data: {
    __schema: {
      types: [
        {
          kind: "OBJECT",
          name: "User",
          description: "A user in the system",
          fields: [
            {
              name: "id",
              description: "Unique identifier for the user",
              type: { name: "ID", kind: "NON_NULL" },
              args: [],
              isDeprecated: false
            },
            {
              name: "name",
              description: "Full name of the user",
              type: { name: "String", kind: "SCALAR" },
              args: [],
              isDeprecated: false
            },
            {
              name: "email",
              description: "Email address of the user",
              type: { name: "String", kind: "SCALAR" },
              args: [],
              isDeprecated: false
            },
            {
              name: "posts",
              description: "Posts created by the user",
              type: { name: "Post", kind: "LIST" },
              args: [
                {
                  name: "limit",
                  description: "Maximum number of posts to return",
                  type: { name: "Int", kind: "SCALAR" },
                  defaultValue: 10
                }
              ],
              isDeprecated: false
            }
          ],
          interfaces: []
        },
        {
          kind: "OBJECT",
          name: "Post",
          description: "A blog post",
          fields: [
            {
              name: "id",
              description: "Unique identifier for the post",
              type: { name: "ID", kind: "NON_NULL" },
              args: [],
              isDeprecated: false
            },
            {
              name: "title",
              description: "Title of the post",
              type: { name: "String", kind: "NON_NULL" },
              args: [],
              isDeprecated: false
            },
            {
              name: "content",
              description: "Content of the post",
              type: { name: "String", kind: "SCALAR" },
              args: [],
              isDeprecated: false
            },
            {
              name: "author",
              description: "Author of the post",
              type: { name: "User", kind: "OBJECT" },
              args: [],
              isDeprecated: false
            },
            {
              name: "publishedAt",
              description: "When the post was published",
              type: { name: "DateTime", kind: "SCALAR" },
              args: [],
              isDeprecated: false
            },
            {
              name: "tags",
              description: "Tags associated with the post",
              type: { name: "String", kind: "LIST" },
              args: [],
              isDeprecated: false
            }
          ],
          interfaces: []
        },
        {
          kind: "OBJECT",
          name: "Query",
          description: "The root query type",
          fields: [
            {
              name: "users",
              description: "Get all users",
              type: { name: "User", kind: "LIST" },
              args: [
                {
                  name: "limit",
                  description: "Maximum number of users to return",
                  type: { name: "Int", kind: "SCALAR" },
                  defaultValue: 20
                },
                {
                  name: "offset",
                  description: "Number of users to skip",
                  type: { name: "Int", kind: "SCALAR" },
                  defaultValue: 0
                }
              ],
              isDeprecated: false
            },
            {
              name: "user",
              description: "Get a user by ID",
              type: { name: "User", kind: "OBJECT" },
              args: [
                {
                  name: "id",
                  description: "User ID",
                  type: { name: "ID", kind: "NON_NULL" },
                  defaultValue: null
                }
              ],
              isDeprecated: false
            },
            {
              name: "posts",
              description: "Get all posts",
              type: { name: "Post", kind: "LIST" },
              args: [
                {
                  name: "limit",
                  description: "Maximum number of posts to return",
                  type: { name: "Int", kind: "SCALAR" },
                  defaultValue: 20
                },
                {
                  name: "authorId",
                  description: "Filter posts by author ID",
                  type: { name: "ID", kind: "SCALAR" },
                  defaultValue: null
                }
              ],
              isDeprecated: false
            }
          ],
          interfaces: []
        },
        {
          kind: "OBJECT",
          name: "Mutation",
          description: "The root mutation type",
          fields: [
            {
              name: "createUser",
              description: "Create a new user",
              type: { name: "User", kind: "OBJECT" },
              args: [
                {
                  name: "input",
                  description: "User creation input",
                  type: { name: "CreateUserInput", kind: "INPUT_OBJECT" },
                  defaultValue: null
                }
              ],
              isDeprecated: false
            },
            {
              name: "updateUser",
              description: "Update an existing user",
              type: { name: "User", kind: "OBJECT" },
              args: [
                {
                  name: "id",
                  description: "User ID",
                  type: { name: "ID", kind: "NON_NULL" },
                  defaultValue: null
                },
                {
                  name: "input",
                  description: "User update input",
                  type: { name: "UpdateUserInput", kind: "INPUT_OBJECT" },
                  defaultValue: null
                }
              ],
              isDeprecated: false
            },
            {
              name: "createPost",
              description: "Create a new post",
              type: { name: "Post", kind: "OBJECT" },
              args: [
                {
                  name: "input",
                  description: "Post creation input",
                  type: { name: "CreatePostInput", kind: "INPUT_OBJECT" },
                  defaultValue: null
                }
              ],
              isDeprecated: false
            }
          ],
          interfaces: []
        },
        {
          kind: "INPUT_OBJECT",
          name: "CreateUserInput",
          description: "Input for creating a user",
          inputFields: [
            {
              name: "name",
              description: "Full name of the user",
              type: { name: "String", kind: "NON_NULL" },
              defaultValue: null
            },
            {
              name: "email",
              description: "Email address of the user",
              type: { name: "String", kind: "NON_NULL" },
              defaultValue: null
            }
          ]
        },
        {
          kind: "INPUT_OBJECT",
          name: "UpdateUserInput",
          description: "Input for updating a user",
          inputFields: [
            {
              name: "name",
              description: "Full name of the user",
              type: { name: "String", kind: "SCALAR" },
              defaultValue: null
            },
            {
              name: "email",
              description: "Email address of the user",
              type: { name: "String", kind: "SCALAR" },
              defaultValue: null
            }
          ]
        },
        {
          kind: "INPUT_OBJECT",
          name: "CreatePostInput",
          description: "Input for creating a post",
          inputFields: [
            {
              name: "title",
              description: "Title of the post",
              type: { name: "String", kind: "NON_NULL" },
              defaultValue: null
            },
            {
              name: "content",
              description: "Content of the post",
              type: { name: "String", kind: "SCALAR" },
              defaultValue: null
            },
            {
              name: "authorId",
              description: "ID of the post author",
              type: { name: "ID", kind: "NON_NULL" },
              defaultValue: null
            },
            {
              name: "tags",
              description: "Tags for the post",
              type: { name: "String", kind: "LIST" },
              defaultValue: null
            }
          ]
        },
        {
          kind: "SCALAR",
          name: "String",
          description: "Built-in String scalar"
        },
        {
          kind: "SCALAR",
          name: "Int",
          description: "Built-in Int scalar"
        },
        {
          kind: "SCALAR",
          name: "ID",
          description: "Built-in ID scalar"
        },
        {
          kind: "SCALAR",
          name: "DateTime",
          description: "Custom DateTime scalar"
        }
      ],
      queryType: { name: "Query" },
      mutationType: { name: "Mutation" },
      subscriptionType: null
    }
  }
};

export const mockUsers = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
  { id: "3", name: "Bob Johnson", email: "bob@example.com" }
];

export const mockPosts = [
  {
    id: "1",
    title: "Getting Started with GraphQL",
    content: "GraphQL is a query language for APIs...",
    authorId: "1",
    publishedAt: "2024-01-15T10:00:00Z",
    tags: ["graphql", "api", "tutorial"]
  },
  {
    id: "2", 
    title: "Advanced React Patterns",
    content: "Learn about advanced React patterns...",
    authorId: "2",
    publishedAt: "2024-01-20T14:30:00Z",
    tags: ["react", "javascript", "patterns"]
  }
];

export async function mockGraphQLRequest(query: string, variables?: any): Promise<any> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));
  
  // Parse query to determine response
  if (query.includes('IntrospectionQuery')) {
    return mockSchema;
  }
  
  if (query.includes('users')) {
    const limit = variables?.limit || 20;
    return {
      data: {
        users: mockUsers.slice(0, limit).map(user => ({
          ...user,
          posts: mockPosts.filter(post => post.authorId === user.id)
        }))
      }
    };
  }
  
  if (query.includes('user(')) {
    const userId = variables?.id || "1";
    const user = mockUsers.find(u => u.id === userId);
    return {
      data: {
        user: user ? {
          ...user,
          posts: mockPosts.filter(post => post.authorId === user.id)
        } : null
      }
    };
  }
  
  if (query.includes('posts')) {
    return {
      data: {
        posts: mockPosts.map(post => ({
          ...post,
          author: mockUsers.find(u => u.id === post.authorId)
        }))
      }
    };
  }
  
  if (query.includes('createUser')) {
    const newUser = {
      id: String(Date.now()),
      ...variables.input
    };
    return {
      data: {
        createUser: newUser
      }
    };
  }
  
  // Default response
  return {
    data: {},
    errors: [
      {
        message: "Query not implemented in mock server",
        extensions: { code: "NOT_IMPLEMENTED" }
      }
    ]
  };
}