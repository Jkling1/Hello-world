import 'dotenv/config'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb } from './db.ts'
import { registerCoreRoutes } from './routes/core.ts'
import { registerTrainingRoutes } from './routes/training.ts'
import { registerTaskRoutes } from './routes/tasks.ts'
import { registerContentRoutes } from './routes/content.ts'
import { registerProgressRoutes } from './routes/progress.ts'
import { registerCoachRoutes } from './routes/coach.ts'

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'warn' } })

app.setErrorHandler((err: { statusCode?: number; code?: string; message?: string }, _req, reply) => {
  const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500
  reply.code(status).send({ error: err.code ?? 'internal_error', message: err.message ?? 'unknown error' })
})

const db = getDb()
registerCoreRoutes(app, db)
registerTrainingRoutes(app, db)
registerTaskRoutes(app, db)
registerContentRoutes(app, db)
registerProgressRoutes(app, db)
registerCoachRoutes(app, db)

// Serve the built web client when it exists (production mode); the Vite dev
// server proxies /api here during development.
const webDist = path.resolve(fileURLToPath(import.meta.url), '../../../web/dist')
if (fs.existsSync(webDist)) {
  app.register(fastifyStatic, { root: webDist })
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'not_found' })
    return reply.sendFile('index.html')
  })
}

const port = Number(process.env.PORT) || 3001
app
  .listen({ port, host: '0.0.0.0' })
  .then(() => console.log(`Vantage server → http://localhost:${port}`))
  .catch((err) => {
    console.error('Failed to start server:', err)
    process.exit(1)
  })
