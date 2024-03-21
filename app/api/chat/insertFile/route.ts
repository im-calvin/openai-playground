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

    // Assuming fileContents is a base64 encoded string of the file's contents
    const fileBlob = Buffer.from(fileContents, 'base64')
    await insertFile(chatId, fileName, fileBlob.toString('utf-8'))

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
