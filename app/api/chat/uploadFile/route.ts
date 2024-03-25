import { insertFileIntoSandbox } from '@/lib/e2b'
import { kv } from '@vercel/kv'

export async function POST(req: Request): Promise<Response> {
  try {
    const { chatId, fileName, userId } = await req.json()
    if (!chatId || !fileName || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    // Retrieve the file contents from the user's uploaded files
    const fileKey = `user:${userId}:files:${fileName}`
    const fileData = await kv.hget<{ contents: string }>(
      `user:${userId}:files`,
      fileKey
    )
    if (!fileData) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404
      })
    }

    // Insert the file into the sandbox
    await insertFileIntoSandbox(chatId, fileName, fileData.contents)

    // Add the file key to the chat's file list
    await kv.zadd(`chat:${chatId}:files`, {
      score: Date.now(),
      member: fileKey
    })

    return new Response(
      JSON.stringify({ message: 'File inserted into sandbox successfully' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error inserting file into sandbox:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500
    })
  }
}
