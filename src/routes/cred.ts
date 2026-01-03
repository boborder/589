import { Hono } from 'hono';
import type { Transaction } from 'xrpl';
import { submitTransaction } from '../module/submit';

const app = new Hono<Env>();

// /api/cred/
export const cred = app
  .get('/create/:type?', async (c) => {
    const type = c.req.param('type') || 'VerifiableCredential';
    const secret = c.env.ALICE_SEED;
    const credential = Buffer.from(type).toString('hex');
    const alice = c.env.ALICE;
    const bob = c.env.BOB;
    const tx: Transaction = {
      Account: alice,
      TransactionType: 'CredentialCreate',
      CredentialType: credential,
      Subject: bob,
    };
    const result = await submitTransaction({ tx, secret });
    return c.json(result);
  })

  .get('/accept', async (c) => {
    const secret = c.env.BOB_SEED;
    const credential = Buffer.from('VerifiableCredential').toString('hex');
    const alice = c.env.ALICE;
    const bob = c.env.BOB;
    const tx: Transaction = {
      Account: bob,
      TransactionType: 'CredentialAccept',
      CredentialType: credential,
      Issuer: alice,
    };
    const result = await submitTransaction({ tx, secret });
    return c.json(result);
  });
