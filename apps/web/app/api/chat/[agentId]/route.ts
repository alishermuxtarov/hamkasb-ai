import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  let messages: Array<{ role: string; content: string }> = []
  let sessionId: string | undefined
  
  try {
    const { agentId } = await params
      const body = await request.json() as { 
        messages?: Array<{ role: string; content: string; parts?: Array<{ type: string; text: string }> }>; 
        sessionId?: string;
        forceNew?: boolean;
      }
    
    // Handle messages with 'parts' structure (from useChat)
    messages = (body.messages || []).map(msg => {
      // If message has 'parts', extract text from parts
      if (msg.parts && msg.parts.length > 0) {
        const textParts = msg.parts
          .filter(part => part.type === 'text')
          .map(part => part.text)
          .join('')
        return {
          role: msg.role,
          content: textParts || msg.content || '',
        }
      }
      return {
        role: msg.role,
        content: msg.content || '',
      }
    })
    
    sessionId = body.sessionId

    const lastMessage = messages[messages.length - 1]?.content || ''

    console.log('[API Route /api/chat] Request:', {
      agentId,
      messageCount: messages.length,
      lastMessage: lastMessage.substring(0, 100),
      sessionId,
    })

    // For librarian, try to proxy to backend API first
    if (agentId === 'librarian') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001'
      const backendUrl = `${apiUrl}/chat/${agentId}`
      
      console.log('[API Route /api/chat] Proxying to backend:', backendUrl)
      
      try {
        const requestBody = {
          message: lastMessage,
          sessionId: body.forceNew ? undefined : sessionId,
          forceNew: body.forceNew,
        }
        
        console.log('[API Route /api/chat] Backend request body:', requestBody)
        
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        console.log('[API Route /api/chat] Backend response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('[API Route /api/chat] Backend response data:', {
            hasMessage: !!data.message,
            messageLength: data.message?.length || 0,
            sessionId: data.sessionId,
          })
          
          // Return as stream for useChat compatibility
          // useChat expects AI SDK format (data stream)
          // We'll create a proper AI SDK data stream from the backend message
          const message = data.message || 'Нет ответа от агента'
          console.log('[API Route /api/chat] Creating AI SDK stream for backend message, length:', message.length)
          
          // Create a data stream in AI SDK format manually
          // Format: 0:"text chunk"\n for text chunks, d:{"finishReason":"stop"}\n for finish
          const encoder = new TextEncoder()
          const stream = new ReadableStream({
            async start(controller) {
              try {
                // Stream the message in chunks to simulate real streaming
                const chunkSize = 30
                for (let i = 0; i < message.length; i += chunkSize) {
                  const chunk = message.slice(i, i + chunkSize)
                  // Escape special characters for JSON string
                  const escapedChunk = JSON.stringify(chunk).slice(1, -1) // Remove quotes from JSON.stringify
                  // AI SDK data stream format: 0:"text"\n
                  const data = `0:"${escapedChunk}"\n`
                  controller.enqueue(encoder.encode(data))
                  // Small delay to simulate streaming
                  await new Promise(resolve => setTimeout(resolve, 15))
                }
                // Send finish signal in AI SDK format
                controller.enqueue(encoder.encode('d:{"finishReason":"stop"}\n'))
                controller.close()
              } catch (error) {
                console.error('[API Route /api/chat] Stream error:', error)
                controller.error(error)
              }
            },
          })
          
          return new Response(stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          })
        } else {
          // Log error response
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText }
          }
          
          console.error('[API Route /api/chat] Backend error response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorData,
          })
          
          // Return error as stream for useChat compatibility
          const errorMessage = errorData.error || errorData.details || `Backend returned ${response.status}`
          const result = await streamText({
            model: openai('gpt-4-turbo'),
            messages: messages as never,
            system: `Ошибка: ${errorMessage}. Попробуйте еще раз или обратитесь к администратору.`,
          })
          return result.toDataStreamResponse()
        }
      } catch (fetchError) {
        // If backend is not available, log and return error as stream
        console.error('[API Route /api/chat] Backend fetch error:', fetchError)
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError)
        const result = await streamText({
          model: openai('gpt-4-turbo'),
          messages: messages as never,
          system: `Ошибка подключения к серверу: ${errorMessage}. Проверьте подключение и попробуйте еще раз.`,
        })
        return result.toDataStreamResponse()
      }
    }

    // For other agents or fallback, use direct AI
    const systemPrompts: Record<string, string> = {
      pr: 'Ты - PR специалист. Помогаешь с публичными отношениями, коммуникациями и созданием PR-стратегий.',
      designer: 'Ты - дизайнер. Помогаешь создавать визуальный контент, графику и дизайн-материалы.',
      smm: 'Ты - SMM специалист. Помогаешь с социальными медиа, созданием контента для соцсетей и маркетингом.',
    }

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages: messages as never,
      system: systemPrompts[agentId] || `Ты - ${agentId} агент. Отвечай на вопросы пользователя профессионально и вежливо.`,
    })
    return result.toDataStreamResponse()
  } catch (error) {
    console.error('[API Route /api/chat] Chat API error:', error)
    console.error('[API Route /api/chat] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    // Return error as stream for compatibility
    const errorMessage = error instanceof Error ? error.message : String(error)
    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages: messages as never,
      system: `Произошла ошибка: ${errorMessage}. Попробуйте еще раз.`,
    })
    return result.toDataStreamResponse()
  }
}

