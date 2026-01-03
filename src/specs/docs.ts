import { env } from 'cloudflare:workers';
import type { GenerateSpecOptions } from 'hono-openapi';

export const docs: Partial<GenerateSpecOptions> = {
  documentation: {
    openapi: '3.1.1',
    info: {
      title: 'OpenAPI',
      version: '1.0.0',
      description: 'OpenAPI Specification',
      license: {
        name: 'MIT License',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      import.meta.env.DEV
        ? {
            url: 'http://localhost:3000',
            description: 'Development',
          }
        : {
            url: env.API_URL,
            description: 'Production',
          },
    ],
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
};
