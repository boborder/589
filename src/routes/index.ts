import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import { openAPIRouteHandler } from 'hono-openapi';
import { basic } from '../middleware/auth';
import { docs } from '../specs/docs';
import { cred } from './cred';
import { root } from './root';
import { verify } from './verify';

const app = new Hono<Env>();

const handler = app
  .route('/', root)
  .route('/api/cred', cred)
  .route('/api/verify', verify)

const routes = handler
  .get('/openapi.json', openAPIRouteHandler(handler, docs))
  .get('/api/v1', basic, swaggerUI({ url: '/openapi.json' }));

export default routes;
