import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  render,
  createStreamableValue
} from 'ai/rsc'
import OpenAI from 'openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage
} from '@/components/stocks'

import { Separator } from '@/components/ui/separator'

import { z } from 'zod'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat } from '@/lib/types'
import { auth } from '@/auth'
import { getUploadedFiles } from '@/app/actions'

import {
  executePythonCode,
  initSandbox,
  insertFileIntoSandbox
} from '@/lib/e2b'
import { CodeBlock } from '@/components/ui/codeblock'
import { File } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages.slice(0, -1),
        {
          id: nanoid(),
          role: 'function',
          name: 'showStockPurchase',
          content: JSON.stringify({
            symbol,
            price,
            defaultAmount: amount,
            status: 'completed'
          })
        },
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function submitUserMessage(content: string, files: File[]) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()
  const selectedFiles = files.filter(file => file.selected)
  const sandboxId = await initSandbox(aiState.get().chatId)
  await Promise.all(
    selectedFiles.map(file =>
      insertFileIntoSandbox(sandboxId, file.name, file.contents)
    )
  )
  // add a system prompt that tells gpt that there is a file called file.name in the sandbox that it can use if needed
  const filePrompts: Message[] = selectedFiles.map(file => {
    return {
      id: file.id,
      content: `There is a file called ${file.name} in the sandbox.`,
      role: 'system'
    }
  })

  console.log('filePrompts: ', filePrompts)

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      ...filePrompts,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const ui = render({
    model: 'gpt-3.5-turbo',
    provider: openai,
    initial: <SpinnerMessage />,
    messages: [
      {
        role: 'system',
        content: `You are a code interpreter bot that can only code in Python. Make sure to print the output of your code.
        
        If the user requests to execute code, call \` exec_code \` function to show the output.
        `
      },
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    // `text` is called when an AI returns a text response (as opposed to a tool call).
    // Its content is streamed from the LLM, so this function will be called
    // multiple times with `content` being incremental.
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    functions: {
      execCode: {
        description:
          'Executes the passed Python code using Python and returns the stdout and stderr.',
        parameters: z
          .object({
            code: z.string().describe('The Python code to execute.')
          })
          .required(),
        render: async function* ({ code }) {
          if (!textStream) {
            textStream = createStreamableValue('')
          }

          yield (
            // what to render while waiting for the code
            <>
              <BotCard>
                <BotMessage content={'Executing code...'} />
              </BotCard>
            </>
          )

          // updates textStream
          const { stdout, stderr } = await executePythonCode(
            code,
            sandboxId,
            textStream
          )

          if (stdout || stderr) {
            textStream.done()

            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'function',
                  name: 'codeOutput',
                  content: JSON.stringify({
                    code,
                    stdout: stdout || 'No output',
                    stderr
                  })
                }
              ]
            })
          }

          // what to render when the tool is done
          return (
            <>
              <BotCard>
                <CodeBlock language="python" value={code} />
                <Separator className="my-2" />
                <CodeBlock language="output" value={textStream.value.curr!} />
              </BotCard>
            </>
          )
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: ui
  }
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id: string
  name?: string
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: {
    chatId: nanoid(),
    messages: []
  },
  unstable_onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  unstable_onSetAIState: async ({ state, done }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      // save chat
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'function' ? (
          message.name === 'codeOutput' ? (
            <BotCard>
              {(() => {
                const parsedContent = JSON.parse(message.content)
                return (
                  <>
                    <CodeBlock language="python" value={parsedContent.code} />
                    <Separator className="my-2" />
                    <CodeBlock language="output" value={parsedContent.stdout} />
                  </>
                )
              })()}
            </BotCard>
          ) : null
        ) : message.role === 'user' ? (
          <UserMessage>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}
