import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, Sparkles, FileText, Users, Brain, Zap, Shield, Globe, CheckCircle2, ExternalLink, Code, MessageSquare, Database, Server, Lock } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section with Video */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Hamkasb.AI
              </h1>
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                MVP
              </Badge>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              AI-Коллега для банков и организаций — революционное решение для автоматизации бизнес-процессов
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <a 
                href="https://hamkasb-ai.uz/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Наш лендинг
              </a>
            </div>
          </div>

          {/* Video Section */}
          <div className="mb-16">
            <Card className="overflow-hidden border-2">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  <Play className="h-6 w-6 text-primary" />
                  Демонстрация проекта
                </CardTitle>
                <CardDescription>
                  Посмотрите, как работает наша система в действии
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/rr_8hDkMPkw"
                    title="Hamkasb.AI Demo Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Librarian Agent Section */}
          <section className="mb-16">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl flex items-center gap-2 mb-2">
                      <FileText className="h-8 w-8 text-primary" />
                      AI-Агент "Библиотекарь"
                    </CardTitle>
                    <CardDescription className="text-lg">
                      Готовое решение для интеллектуального управления документами
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-lg px-4 py-2">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Реализовано
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-background border">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        Умная обработка документов
                      </h3>
                      <p className="text-muted-foreground">
                        Агент принимает файлы в различных форматах (DOCX, PDF, XLS и др.) и автоматически 
                        векторизирует их в базе данных Qdrant. Все документы организации можно загружать 
                        по каталогам для удобной организации и быстрого поиска.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-background border">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Интуитивный AI-чат
                      </h3>
                      <p className="text-muted-foreground">
                        Работайте с документами через естественный язык. Задавайте вопросы, 
                        ищете информацию, анализируйте содержимое — всё через простой диалог. 
                        Агент понимает контекст и находит нужную информацию в ваших документах.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-background border">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Многоязычная поддержка
                      </h3>
                      <p className="text-muted-foreground">
                        Документы автоматически переводятся на русский, английский, узбекский и 
                        каракалпакский языки. Чатбот поддерживает общение на всех этих языках, 
                        что критично для рынка Узбекистана.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-background border">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        Безопасность данных
                      </h3>
                      <p className="text-muted-foreground">
                        В продуктовой версии система разворачивается на ваших серверах, 
                        включая AI-модели. Никакие конфиденциальные данные не покидают 
                        вашу инфраструктуру.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-6 rounded-lg bg-primary/10 border border-primary/20">
                  <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                    <Zap className="h-6 w-6 text-primary" />
                    Как это работает
                  </h3>
                  <ol className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold mt-0.5">1</span>
                      <span>Загрузите документы вашей организации в систему, организовав их по каталогам</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold mt-0.5">2</span>
                      <span>Документы автоматически обрабатываются, векторизируются и переводятся на 4 языка</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold mt-0.5">3</span>
                      <span>Задавайте вопросы на любом языке — агент найдет нужную информацию в ваших документах</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold mt-0.5">4</span>
                      <span>Экономьте до 70% времени на поиске информации и анализе документов</span>
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Stage 2 Description */}
          <section className="mb-16">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Sparkles className="h-8 w-8 text-primary" />
                  Этап 2: Разработка и внедрение системы
                </CardTitle>
                <CardDescription className="text-lg">
                  Реализация полнофункциональной платформы для автоматизации бизнес-процессов
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Brain className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Интеллектуальные AI-Агенты</h3>
                        <p className="text-muted-foreground">
                          Разработана система специализированных AI-агентов для различных бизнес-задач: 
                          управление документами, работа с клиентами, финансы, кадры и многое другое. 
                          Каждый агент обучен решать специфические задачи в своей области.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Умное управление документами</h3>
                        <p className="text-muted-foreground">
                          Внедрена система интеллектуальной обработки документов с возможностью 
                          автоматического извлечения информации, поиска по содержимому и 
                          многоязычной поддержки. Система понимает контекст и может отвечать 
                          на вопросы по документам на русском, узбекском, английском и каракалпакском языках.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Автоматизация бизнес-процессов</h3>
                        <p className="text-muted-foreground">
                          Создана платформа для автоматизации рутинных операций в банках и организациях. 
                          Система помогает сотрудникам быстрее находить информацию, обрабатывать запросы 
                          и принимать решения, экономя до 70% времени на рутинных задачах.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Zap className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Интеграция и масштабируемость</h3>
                        <p className="text-muted-foreground">
                          Разработана архитектура, позволяющая легко интегрировать систему с 
                          существующими корпоративными системами. Платформа готова к масштабированию 
                          и может обслуживать организации любого размера.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 rounded-lg bg-muted/50 border">
                  <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    Бизнес-ценность проекта
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Повышение эффективности:</strong> Сокращение времени на поиск информации и обработку документов на 60-70%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Снижение операционных затрат:</strong> Автоматизация рутинных процессов позволяет перераспределить ресурсы на стратегические задачи</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Улучшение качества обслуживания:</strong> Быстрый доступ к информации позволяет сотрудникам быстрее отвечать на запросы клиентов</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Многоязычная поддержка:</strong> Система работает на 4 языках, что критично для рынка Узбекистана</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span><strong>Масштабируемость:</strong> Решение готово к внедрению в организациях любого размера</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Bonus Tasks Section */}
          <section className="mb-16">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Sparkles className="h-8 w-8 text-primary" />
                  Бонус-задания
                </CardTitle>
                <CardDescription className="text-lg">
                  Дополнительные функции, реализованные для демонстрации возможностей платформы
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Chatbot Bonus */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-6 w-6 text-primary" />
                        AI-Чатбот
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Реализован внутри нашего демо с помощью нашей же системы. Чатбот имеет "память" 
                        и умеет вести диалог, отвечая на вопросы о проекте.
                      </p>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm font-semibold mb-2">Примеры вопросов:</p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>"Расскажи о проекте Hamkasb AI"</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>"Расскажи о команде проекта Hamkasb AI"</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>"Найди информацию о хакатоне AI500"</span>
                          </li>
                        </ul>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        P.S. На этапе демо, для отображения ответа от чатбота приходится обновлять страницу.
                      </p>
                    </CardContent>
                  </Card>

                  {/* API Bonus */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-6 w-6 text-primary" />
                        API-доступ
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Полноценный REST API с документацией Swagger. Интегрируйте нашего AI-агента 
                        "Библиотекарь" в ваши системы.
                      </p>
                      <div className="p-4 rounded-lg bg-muted/50 font-mono text-xs overflow-x-auto">
                        <div className="text-primary mb-2">POST https://hamkasb-ai.uz/api/chat/librarian</div>
                        <div className="text-muted-foreground">
                          <div className="mb-1">Request Body:</div>
                          <pre className="whitespace-pre-wrap">{`{
  "messages": [{
    "role": "user",
    "content": "Найди информацию о хакатоне AI500"
  }],
  "sessionId": "...",
  "forceNew": false
}`}</pre>
                        </div>
                      </div>
                      <a 
                        href="https://hamkasb-ai.uz/api/docs" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Открыть Swagger документацию
                      </a>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Tech Stack Section */}
          <section className="mb-16">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Server className="h-6 w-6 text-primary" />
                  Технологический стек
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">Backend</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• PostgreSQL</li>
                      <li>• Qdrant (векторная БД)</li>
                      <li>• Elysia.js (Bun)</li>
                      <li>• OpenAI GPT-4</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">Frontend</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Next.js 14</li>
                      <li>• React</li>
                      <li>• TypeScript</li>
                      <li>• Tailwind CSS</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">Инфраструктура</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Vercel Blob Storage</li>
                      <li>• PM2 (process manager)</li>
                      <li>• Nginx</li>
                      <li>• Docker-ready</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="border-2 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Готовы попробовать?</h2>
                <p className="text-muted-foreground mb-6">
                  Перейдите в панель управления и начните работу с AI-агентом "Библиотекарь"
                </p>
                <Link href={`/${locale}/dashboard`}>
                  <Button size="lg" className="gap-2">
                    Перейти к панели управления
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

