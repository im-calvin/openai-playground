import { kv } from '@vercel/kv'

export async function POST(req: Request): Promise<Response> {
  try {
    // fileId is "chat:rTjvv6f:files:sedds_df.txt"
    const { fileId } = await req.json()
    if (!fileId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    const fileArr = fileId.split(':')

    // Remove the file from Vercel KV
    await kv.hdel(`user:${fileArr[1]}:files`, fileId)

    return new Response(
      JSON.stringify({ message: 'File deleted successfully' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting file:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500
    })
  }
}
