import type { INodeProperties } from 'n8n-workflow';

// Define the operations for the Task resource
export const taskOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['task'],
      },
    },
    options: [
      {
        name: 'Get',
        value: 'get',
        action: 'Get task details',
        description: 'Retrieve details for a specific task',
      },
    ],
    default: 'get',
  },
];

// Define the fields for the Task resource operations
export const taskFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                                  task:get                                  */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Task ID',
    name: 'taskId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['task'],
        operation: ['get'],
      },
    },
    default: '',
    description: 'The unique identifier of the task to retrieve details for',
  },
];
