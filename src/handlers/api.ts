import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';

const app = new Hono();

app.get('/hello', (c) => {
  const name = c.req.query('name') ?? 'Mariner';
  return c.json({ message: `Hello, ${name}!` });
});

app.get('/ping', (c) => c.text('Healthy Connection'));

export const handler = handle(app);
