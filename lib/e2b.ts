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

export async function insertFile(
  chatId: string,
  fileName: string,
  fileContents: string
) {
  // search for sandboxId with chatId
  let sandboxId = await kv.get<string>(chatId)
  if (!sandboxId) {
    throw new Error(`SandboxId not found with chatId: ${chatId}`)
  } else if (typeof sandboxId !== 'string') {
    throw new Error(`SandboxId not of type string`)
  }
  const sandbox = await Sandbox.reconnect(sandboxId)
  await sandbox.filesystem.write(fileName, fileContents)
}

// TODO implement a cleanup function

export async function executePythonCode(
  code: string,
  sandboxId: string,
  textStream: ReturnType<typeof createStreamableValue<string>>
): Promise<{ stdout: string[]; stderr: string[] }> {
  const sandbox = await CodeInterpreterV2.reconnect(sandboxId)
  const result = await sandbox.execPython(code) // the code has to 'print' something
  // TODO: stream the output of the execPython
  // maybe the solution is to call aiState.update()
  // or https://sdk.vercel.ai/docs/guides/providers/openai-functions

  return { stdout: result.stdout, stderr: result.stderr }
}
