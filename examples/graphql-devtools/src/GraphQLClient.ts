import { mockGraphQLRequest } from './mockGraphQLServer';

export class GraphQLClient {
  private endpoint: string;

  constructor(endpoint: string = '/graphql') {
    this.endpoint = endpoint;
  }

  async query(query: string, variables?: any): Promise<any> {
    // Try real endpoint first, fall back to mock
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Real GraphQL endpoint not available, using mock data:', error);
      // Fall back to mock server
      return await mockGraphQLRequest(query, variables);
    }
  }

  async mutate(mutation: string, variables?: any): Promise<any> {
    return this.query(mutation, variables);
  }
}