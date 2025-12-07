import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { librarianTools } from './tools'
import { librarianSystemPrompt } from './prompts'

/**
 * Агент "Библиотекарь"
 * Использует generateText с tools для автоматического управления циклом вызовов инструментов
 */
export const librarianAgent = {
  id: 'librarian',
  async generate(options: { messages: unknown[]; prompt?: string }) {
    // Логируем последнее сообщение пользователя для отладки
    const lastUserMessage = Array.isArray(options.messages) 
      ? options.messages.find((m: unknown) => (m as { role?: string })?.role === 'user')
      : null
    
    // Определяем язык вопроса для усиления промпта
    let languageHint = ''
    if (lastUserMessage) {
      const content = (lastUserMessage as { content?: string })?.content || ''
      console.log('[Librarian Agent] Processing user message:', content.substring(0, 100))
      
      // Простое определение языка по ключевым словам
      const contentLower = content.toLowerCase()
      if (/[xakaton|fayl|top|haqida|qidir|topish|haqidagi]/.test(contentLower)) {
        languageHint = '\n\n🚨 ВАЖНО: Вопрос пользователя на УЗБЕКСКОМ языке! ОБЯЗАТЕЛЬНО отвечай на УЗБЕКСКОМ языке!'
      } else if (/[найди|документ|расскажи|в курсе|какой|какие]/.test(contentLower)) {
        languageHint = '\n\n🚨 ВАЖНО: Вопрос пользователя на РУССКОМ языке! ОБЯЗАТЕЛЬНО отвечай на РУССКОМ языке!'
      } else if (/[find|document|search|tell me|what|which]/.test(contentLower)) {
        languageHint = '\n\n🚨 ВАЖНО: Вопрос пользователя на АНГЛИЙСКОМ языке! ОБЯЗАТЕЛЬНО отвечай на АНГЛИЙСКОМ языке!'
      }
    }
    
    // Добавляем подсказку о языке в системный промпт
    const enhancedSystemPrompt = librarianSystemPrompt + languageHint
    
    return generateText({
      model: openai('gpt-4-turbo'),
      system: enhancedSystemPrompt,
      tools: librarianTools,
      messages: options.messages as never,
      prompt: options.prompt,
      maxSteps: 20, // Максимум 20 шагов для многошаговых операций с инструментами
      maxTokens: 4096,
      // Включаем детальное логирование для отладки
      onStepFinish: (step) => {
        console.log(`[Librarian Agent] Step ${step.stepType}:`, {
          toolCalls: step.toolCalls?.length || 0,
          toolNames: step.toolCalls?.map((tc: { toolName?: string }) => tc.toolName) || [],
          text: step.text?.substring(0, 100),
          finishReason: step.finishReason,
        })
        
        // Логируем вызовы инструментов
        if (step.toolCalls && step.toolCalls.length > 0) {
          const hasSearchTool = step.toolCalls.some((tc: { toolName?: string }) => tc.toolName === 'searchDocuments')
          if (hasSearchTool) {
            console.log('[Librarian Agent] ✅ searchDocuments tool called correctly')
          }
        }
      },
    })
  },
}

