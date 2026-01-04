import { Hono } from 'hono';
import { languageDetector } from 'hono/language';
import { logger } from 'hono/logger';
import { poweredBy } from 'hono/powered-by';
import { prettyJSON } from 'hono/pretty-json';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import { partyserverMiddleware } from 'hono-party';
import { connInfo, context } from './context';
import { cookie, headers } from './headers';

const middleware = new Hono<Env>()
  // PartyServer ミドルウェアを適用 /parties/:id?/:room? で良い
  .use('/parties/:id?/:room?', partyserverMiddleware())
  .use(
    secureHeaders(),
    logger(),
    timing(),
    requestId(),
    prettyJSON(),
    poweredBy({ serverName: '589' }),
    languageDetector({
      supportedLanguages: ['ja', 'en'],
      fallbackLanguage: 'ja',
    }),
    context,
    cookie,
    headers,
    connInfo,
  );

export default middleware;
