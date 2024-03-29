import { Sandbox, CodeInterpreterV2 } from 'e2b'
import { ChatCompletionTool } from 'openai/resources'
import { kv } from '@vercel/kv'
import { StreamableValue, createStreamableValue, getAIState } from 'ai/rsc'

// example
const functions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'exec_code',
      description:
        'Executes the passed Python code using Python and returns the stdout and stderr.',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The Python code to execute.'
          }
        },
        required: ['code']
      }
    }
  }
]

// returns old sandboxId if the sandbox was created previously for this chat otherwise creates a new sandbox for this chat
export async function initSandbox(chatId: string): Promise<string> {
  let sandboxId = await kv.get(chatId)
  if (sandboxId) {
    return sandboxId as string
  }
  const sandbox = await CodeInterpreterV2.create({
    apiKey: process.env.E2B_API_KEY
    // could potentially attach userId here
    // metadata: {
    //   userId: userId
    // }
  })

  await sandbox.keepAlive(59 * 60 * 1000) // keep sandbox alive for 59 minutes

  // consider cleanup with a setTimeout?

  await kv.set(chatId, sandbox.id)
  return sandbox.id
}

export async function insertFileIntoSandbox(
  sandboxId: string,
  fileName: string,
  fileContents: string // base64 encoded string
) {
  const sandbox = await Sandbox.reconnect(sandboxId)
  const cwd = sandbox.cwd
  // don't reupload the file if the file is already in the sandbox
  const files = await sandbox.filesystem.list(cwd || '/home/user') // default cwd is '/home/user' https://e2b.dev/docs/sandbox/api/cwd
  if (fileName in files.map(f => f.name)) {
    console.log(`File ${fileName} already exists in sandbox ${sandboxId}`)
    return
  }
  // convert base64 string to blob
  const fileContentsBlob = new Blob([Buffer.from(fileContents, 'base64')], {
    type: 'application/octet-stream'
  })
  await sandbox.uploadFile(fileContentsBlob, fileName)
  console.log(`writing file ${fileName} to sandbox ${sandboxId}`)
}

// TODO implement a cleanup function

export async function executePythonCode(
  code: string,
  sandboxId: string,
  textStream: ReturnType<typeof createStreamableValue<string>>
): Promise<{ stdout: string[]; stderr: string[] }> {
  const sandbox = await CodeInterpreterV2.reconnect(sandboxId)
  const result = await sandbox.execPython(code, out => {
    textStream.update(textStream.value.curr + out.line + '\n')
  }) // the code has to 'print' something
  // TODO: stream the output of the execPython
  // maybe the solution is to call aiState.update()
  // or https://sdk.vercel.ai/docs/guides/providers/openai-functions

  return { stdout: result.stdout, stderr: result.stderr }
}
