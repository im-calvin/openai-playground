import { Sandbox, CodeInterpreterV2 } from 'e2b'
import { ChatCompletionTool } from 'openai/resources'
import { kv } from '@vercel/kv'

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

// TODO implement a cleanup function

export async function executePythonCode(
  code: string,
  sandboxId: string
): Promise<{ stdout: string[]; stderr: string[] }> {
  const sandbox = await CodeInterpreterV2.reconnect(sandboxId)
  const result = await sandbox.execPython(code)

  return { stdout: result.stdout, stderr: result.stderr }
}
