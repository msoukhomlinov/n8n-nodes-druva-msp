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
      {
        name: 'Wait for Completion',
        value: 'waitForCompletion',
        action: 'Wait for task completion',
        description: 'Poll a task until it completes or reaches timeout',
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

  /* -------------------------------------------------------------------------- */
  /*                           task:waitForCompletion                           */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Task ID',
    name: 'taskId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['task'],
        operation: ['waitForCompletion'],
      },
    },
    default: '',
    description: 'The unique identifier of the task to wait for completion',
  },
  {
    displayName: 'Maximum Wait Time',
    name: 'maxWaitTime',
    type: 'number',
    required: false,
    displayOptions: {
      show: {
        resource: ['task'],
        operation: ['waitForCompletion'],
      },
    },
    default: 300,
    description: 'Maximum time to wait for task completion in seconds (default: 5 minutes)',
  },
  {
    displayName: 'Poll Interval',
    name: 'pollInterval',
    type: 'number',
    required: false,
    displayOptions: {
      show: {
        resource: ['task'],
        operation: ['waitForCompletion'],
      },
    },
    default: 5,
    description: 'Interval between polling attempts in seconds (default: 5 seconds)',
  },
];
