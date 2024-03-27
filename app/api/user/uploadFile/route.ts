import { kv } from '@vercel/kv'

// upload file to kv database for each user (file gets later attached inserted in chat)
export async function POST(req: Request): Promise<Response> {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    const fileName = file.name

    // Generate a unique key for the file
    const fileKey = `user:${userId}:files:${fileName}`

    // Convert ArrayBuffer to a base64-encoded string
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const base64String = btoa(
      String.fromCharCode.apply(null, Array.from(uint8Array))
    )

    // Store the file metadata in Vercel KV
    await kv.hset(`user:${userId}:files`, {
      [fileKey]: {
        id: fileKey,
        name: fileName,
        contents: base64String,
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
