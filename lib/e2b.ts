import { Sandbox, CodeInterpreterV2 } from 'e2b'
import { ChatCompletionTool } from 'openai/resources'

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

export async function executePythonCode(code: string) {
  const sandbox = await Sandbox.create({
    template: 'kelvin-sandbox',
    apiKey: process.env.E2B_API_KEY
  })

  await sandbox.filesystem.write('/code.py', code)

  const codepy = await sandbox.process.start({
    cmd: 'python3 /code.py'
  })
  await codepy.wait()

  const stdout = codepy.output.stdout
  const stderr = codepy.output.stderr

  sandbox.close()

  return { stdout, stderr }
}
