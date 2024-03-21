import { CodeInterpreterV2 } from 'e2b'
import { kv } from '@vercel/kv'

export async function POST(req: Request) {
  const { id, userId } = await req.json() // id of the chat session,
  const sandbox = await CodeInterpreterV2.create({
    apiKey: process.env.E2B_API_KEY,
    metadata: {
      userId: userId
    }
  })

  await sandbox.keepAlive(5 * 60 * 1000) // keep sandbox alive for 5 minutes

  await kv.set(id, sandbox.id)
  return new Response(JSON.stringify({ id: sandbox.id }), {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
