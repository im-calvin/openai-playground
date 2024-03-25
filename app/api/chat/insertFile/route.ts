import { insertFile } from '@/lib/e2b'
import { kv } from '@vercel/kv'

export async function POST(req: Request): Promise<Response> {
  try {
    const { chatId, fileName, fileContents, userId } = await req.json()
    if (!chatId || !fileName || !fileContents || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    // insert file into sandbox
    // fileContents is utf-8 encoded string
    await insertFile(chatId, fileName, fileContents)

    // Generate a unique key for the file
    const fileKey = `chat:${chatId}:files:${fileName}`

    // Store the file metadata in Vercel KV
    await kv.hset(`user:${userId}:files`, {
      fileKey: {
        id: fileKey,
        name: fileName,
        contents: fileContents
      }
    })

    // Add the file key to the chat's file list
    await kv.zadd(`chat:${chatId}:files`, {
      score: Date.now(),
      member: fileKey
    })
    return new Response(
      JSON.stringify({ message: 'File inserted successfully' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error inserting file:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500
    })
  }
}
