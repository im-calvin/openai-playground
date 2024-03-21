import Sandbox from 'e2b'
import { kv } from '@vercel/kv'

export async function POST(req: Request) {
  const { id } = await req.json() // id of chat
  const sandboxId = await kv.get<string>(id)
  if (typeof sandboxId === 'string') {
    try {
      await Sandbox.kill(sandboxId, process.env.E2B_API_KEY)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sandbox killed successfully.'
        }),
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to kill the sandbox.'
        }),
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
  } else {
    return new Response(
      JSON.stringify({ success: false, message: 'Sandbox ID not found.' }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
