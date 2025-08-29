import {
  parse,
  validate,
  buildClientSchema,
  getIntrospectionQuery,
  introspectionFromSchema,
  DocumentNode,
  GraphQLSchema,
  GraphQLError,
  OperationDefinitionNode,
  FieldNode,
  SelectionNode,
  ArgumentNode,
  VariableDefinitionNode,
  Kind,
  isScalarType,
  isObjectType,
  isInterfaceType,
  isUnionType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  GraphQLType,
  GraphQLField,
  GraphQLInputField,
  GraphQLEnumValue as GQLEnumValue
} from 'graphql';

import type {
  GraphQLOperation,
  SchemaInfo,
  GraphQLTypeInfo,
  GraphQLFieldInfo,
  GraphQLArgument,
  GraphQLEnumValue,
  GraphQLInputField as TypedInputField,
  QueryBuilderState,
  SelectedField,
  ValidationError
} from '../types';

/**
 * Parse GraphQL query string and extract operation information
 */
export function parseGraphQLQuery(query: string, variables?: Record<string, any>): Partial<GraphQLOperation> {
  try {
    const document = parse(query);
    const operation = document.definitions.find(
      (def): def is OperationDefinitionNode => def.kind === Kind.OPERATION_DEFINITION
    );

    if (!operation) {
      throw new Error('No operation definition found');
    }

    return {
      operationType: operation.operation,
      operationName: operation.name?.value,
      query: query.trim(),
      variables,
      status: 'pending'
    };
  } catch (error) {
    throw new Error(`Failed to parse GraphQL query: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate GraphQL query against schema
 */
export function validateGraphQLQuery(
  query: string,
  schema: GraphQLSchema
): ValidationError[] {
  try {
    const document = parse(query);
    const errors = validate(schema, document);
    
    return errors.map((error: GraphQLError): ValidationError => ({
      message: error.message,
      line: error.locations?.[0]?.line,
      column: error.locations?.[0]?.column,
      severity: 'error'
    }));
  } catch (parseError) {
    return [{
      message: parseError instanceof Error ? parseError.message : 'Parse error',
      severity: 'error'
    }];
  }
}

/**
 * Build schema from introspection result
 */
export function buildSchemaFromIntrospection(introspectionResult: any): GraphQLSchema {
  try {
    return buildClientSchema(introspectionResult.data || introspectionResult);
  } catch (error) {
    throw new Error(`Failed to build schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get introspection query string
 */
export function getSchemaIntrospectionQuery(): string {
  return getIntrospectionQuery({
    descriptions: true,
    schemaDescription: true,
    inputValueDeprecation: true,
    directiveIsRepeatable: true,
    specifiedByUrl: true
  });
}

/**
 * Extract schema information for DevTools
 */
export function extractSchemaInfo(schema: GraphQLSchema): SchemaInfo {
  const queryType = schema.getQueryType();
  const mutationType = schema.getMutationType();
  const subscriptionType = schema.getSubscriptionType();

  const typeMap = schema.getTypeMap();
  const types: GraphQLTypeInfo[] = Object.values(typeMap)
    .filter(type => !type.name.startsWith('__')) // Filter out introspection types
    .map(type => convertTypeToInfo(type));

  const queries = queryType ? Object.values(queryType.getFields()) : [];
  const mutations = mutationType ? Object.values(mutationType.getFields()) : [];
  const subscriptions = subscriptionType ? Object.values(subscriptionType.getFields()) : [];

  return {
    schema,
    types,
    queries,
    mutations,
    subscriptions,
    introspectionQuery: getSchemaIntrospectionQuery(),
    lastUpdated: Date.now()
  };
}

/**
 * Convert GraphQL type to TypeInfo for DevTools
 */
function convertTypeToInfo(type: GraphQLType): GraphQLTypeInfo {
  const baseInfo: GraphQLTypeInfo = {
    name: type.name,
    kind: type.toString(),
    description: 'description' in type ? type.description || undefined : undefined
  };

  if (isObjectType(type) || isInterfaceType(type)) {
    const fieldMap = type.getFields();
    baseInfo.fields = Object.values(fieldMap).map(field => convertFieldToInfo(field));
    
    if (isObjectType(type)) {
      const interfaces = type.getInterfaces();
      baseInfo.interfaces = interfaces.map(iface => convertTypeToInfo(iface));
    }
  }

  if (isUnionType(type)) {
    const possibleTypes = type.getTypes();
    baseInfo.possibleTypes = possibleTypes.map(t => convertTypeToInfo(t));
  }

  if (isEnumType(type)) {
    const enumValues = type.getValues();
    baseInfo.enumValues = enumValues.map((value: GQLEnumValue): GraphQLEnumValue => ({
      name: value.name,
      description: value.description || undefined,
      isDeprecated: value.isDeprecated,
      deprecationReason: value.deprecationReason || undefined
    }));
  }

  if (isInputObjectType(type)) {
    const fieldMap = type.getFields();
    baseInfo.inputFields = Object.values(fieldMap).map((field: GraphQLInputField): TypedInputField => ({
      name: field.name,
      description: field.description || undefined,
      type: field.type.toString(),
      defaultValue: field.defaultValue
    }));
  }

  return baseInfo;
}

/**
 * Convert GraphQL field to FieldInfo for DevTools
 */
function convertFieldToInfo(field: GraphQLField<any, any>): GraphQLFieldInfo {
  return {
    name: field.name,
    description: field.description || undefined,
    type: field.type.toString(),
    args: field.args.map(arg => ({
      name: arg.name,
      description: arg.description || undefined,
      type: arg.type.toString(),
      defaultValue: arg.defaultValue
    })),
    isDeprecated: field.isDeprecated,
    deprecationReason: field.deprecationReason || undefined
  };
}

/**
 * Generate GraphQL query from query builder state
 */
export function generateQueryFromBuilder(builderState: QueryBuilderState): string {
  const { operationType, selectedFields, variables, operationName } = builderState;
  
  if (selectedFields.length === 0) {
    return '';
  }

  const variablesString = variables.length > 0
    ? `(${variables.map(v => `$${v.name}: ${v.type}${v.required ? '!' : ''}`).join(', ')})`
    : '';

  const operationDeclaration = operationName
    ? `${operationType} ${operationName}${variablesString}`
    : `${operationType}${variablesString}`;

  const fieldsString = generateFieldsString(selectedFields, 0);

  return `${operationDeclaration} {\n${fieldsString}\n}`;
}

/**
 * Generate fields string for query
 */
function generateFieldsString(fields: SelectedField[], indentLevel: number): string {
  const indent = '  '.repeat(indentLevel + 1);
  
  return fields.map(field => {
    let fieldString = `${indent}${field.alias ? `${field.alias}: ` : ''}${field.fieldName}`;
    
    if (field.arguments.length > 0) {
      const argsString = field.arguments
        .map(arg => `${arg.name}: ${formatArgumentValue(arg.value, arg.variableName)}`)
        .join(', ');
      fieldString += `(${argsString})`;
    }
    
    if (field.subFields.length > 0) {
      const subFieldsString = generateFieldsString(field.subFields, indentLevel + 1);
      fieldString += ` {\n${subFieldsString}\n${indent}}`;
    }
    
    return fieldString;
  }).join('\n');
}

/**
 * Format argument value for query generation
 */
function formatArgumentValue(value: any, variableName?: string): string {
  if (variableName) {
    return `$${variableName}`;
  }
  
  if (typeof value === 'string') {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  
  if (typeof value === 'boolean' || typeof value === 'number') {
    return value.toString();
  }
  
  if (value === null) {
    return 'null';
  }
  
  if (Array.isArray(value)) {
    return `[${value.map(v => formatArgumentValue(v)).join(', ')}]`;
  }
  
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    const formattedEntries = entries.map(([k, v]) => `${k}: ${formatArgumentValue(v)}`);
    return `{${formattedEntries.join(', ')}}`;
  }
  
  return JSON.stringify(value);
}

/**
 * Extract fields from GraphQL document
 */
export function extractFieldsFromDocument(document: DocumentNode): SelectedField[] {
  const operation = document.definitions.find(
    (def): def is OperationDefinitionNode => def.kind === Kind.OPERATION_DEFINITION
  );

  if (!operation) {
    return [];
  }

  return extractFieldsFromSelectionSet(operation.selectionSet.selections, 'Query');
}

/**
 * Extract fields from selection set
 */
function extractFieldsFromSelectionSet(selections: readonly SelectionNode[], parentType: string): SelectedField[] {
  return selections
    .filter((selection): selection is FieldNode => selection.kind === Kind.FIELD)
    .map(field => ({
      fieldName: field.name.value,
      alias: field.alias?.value,
      arguments: field.arguments?.map(arg => ({
        name: arg.name.value,
        value: extractArgumentValue(arg),
        type: 'String' // This would need schema context to determine actual type
      })) || [],
      subFields: field.selectionSet 
        ? extractFieldsFromSelectionSet(field.selectionSet.selections, field.name.value)
        : [],
      parentType
    }));
}

/**
 * Extract argument value from AST
 */
function extractArgumentValue(arg: ArgumentNode): any {
  const value = arg.value;
  
  switch (value.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
    case Kind.INT:
    case Kind.FLOAT:
      return value.value;
    case Kind.NULL:
      return null;
    case Kind.VARIABLE:
      return `$${value.name.value}`;
    case Kind.LIST:
      return value.values.map(v => extractArgumentValue({ ...arg, value: v }));
    case Kind.OBJECT:
      return Object.fromEntries(
        value.fields.map(field => [
          field.name.value,
          extractArgumentValue({ ...arg, value: field.value })
        ])
      );
    default:
      return value;
  }
}

/**
 * Prettify GraphQL query string
 */
export function prettifyQuery(query: string): string {
  try {
    const document = parse(query);
    return query; // For now, return as-is. Could implement proper formatting later.
  } catch {
    return query;
  }
}

/**
 * Detect if a network request is a GraphQL operation
 */
export function isGraphQLRequest(url: string, method: string, body?: string): boolean {
  // Check URL patterns
  if (url.includes('/graphql') || url.includes('/graph')) {
    return true;
  }
  
  // Check if it's a POST request with GraphQL-like body
  if (method.toLowerCase() === 'post' && body) {
    try {
      const parsedBody = JSON.parse(body);
      return !!(parsedBody.query || parsedBody.operationName);
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Extract GraphQL operation from network request
 */
export function extractGraphQLFromRequest(body: string): Partial<GraphQLOperation> | null {
  try {
    const parsedBody = JSON.parse(body);
    
    if (!parsedBody.query) {
      return null;
    }
    
    return parseGraphQLQuery(parsedBody.query, parsedBody.variables);
  } catch {
    return null;
  }
}