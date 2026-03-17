import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Vigil API Skeleton'))

export default {
  port: 3001,
  fetch: app.fetch,
}
