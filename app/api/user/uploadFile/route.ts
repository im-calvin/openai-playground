import { kv } from '@vercel/kv'

// upload file to kv database for each user (file gets later attached inserted in chat)
export async function POST(req: Request): Promise<Response> {
  try {
    const { fileName, fileContents, userId } = await req.json()
    if (!fileName || !fileContents || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    // Generate a unique key for the file
    const fileKey = `user:${userId}:files:${fileName}`

    // Store the file metadata in Vercel KV
    await kv.hset(`user:${userId}:files`, {
      [fileKey]: {
        id: fileKey,
        name: fileName,
        contents: fileContents,
        selected: false
      }
    })

    return new Response(
      JSON.stringify({ id: fileKey, message: 'File uploaded successfully' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error uploading file:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500
    })
  }
}
