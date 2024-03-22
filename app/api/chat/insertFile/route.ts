import type { NextApiRequest, NextApiResponse } from 'next'
import { insertFile } from '@/lib/e2b'

export async function POST(req: Request): Promise<Response> {
  try {
    const { chatId, fileName, fileContents } = await req.json()
    if (!chatId || !fileName || !fileContents) {
      console.log(chatId, fileName, fileContents)
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    // fileContents is utf-8 encoded string
    await insertFile(chatId, fileName, fileContents)

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
