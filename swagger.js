// swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Backend API Docs',
      version: '1.0.0',
      description: 'API documentation for the backend',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/**/*.js'], // Scan all routes for Swagger JSDoc
};

const swaggerSpec = swaggerJSDoc(options);

function swaggerDocs(app) {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        docExpansion: 'none', // 👈 Collapse all sections by default
      },
    })
  );
}

module.exports = swaggerDocs;
