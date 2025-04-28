import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API Documentation',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            username: { type: 'string' },
            password: { type: 'string' },
            role: { type: 'string' },
          },
          required: ['email', 'password'],
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});
