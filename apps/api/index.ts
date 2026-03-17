import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { db } from './db'
import { contracts, stateEntries } from './db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const app = new Hono()

app.use('*', logger())

// Contract Registration
const registerSchema = z.object({
  address: z.string().min(50), // Stellar G/C address
  network: z.enum(['mainnet', 'testnet', 'futurenet']),
  name: z.string().optional(),
})

app.post('/contracts/register', zValidator('json', registerSchema), async (c) => {
  const { address, network, name } = c.req.valid('json')

  try {
    const [contract] = await db.insert(contracts).values({
      address,
      network,
      name,
    }).returning()

    return c.json({
      success: true,
      data: contract
    }, 201)
  } catch (err) {
    if ((err as any).code === '23505') {
      return c.json({ error: 'Contract already registered' }, 409)
    }
    return c.json({ error: 'Failed to register contract' }, 500)
  }
})

// List all contracts
app.get('/contracts', async (c) => {
  const allContracts = await db.select().from(contracts)
  return c.json({ data: allContracts })
})

// Get contract inventory
app.get('/contracts/:id/inventory', async (c) => {
  const contractId = c.req.param('id')
  
  const inventory = await db.select().from(stateEntries).where(eq(stateEntries.contractId, contractId))
  
  // TODO: Join with latest TTL history for runway metrics
  
  return c.json({ data: inventory })
})

// Status endpoint
app.get('/status', (c) => {
  return c.json({
    message: 'Vigil API',
    status: 'online'
  })
})

export default {
  port: 3001,
  fetch: app.fetch,
}
