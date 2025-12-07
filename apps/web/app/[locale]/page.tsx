import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Play, Sparkles, FileText, Users, Brain, Zap, Shield, Globe } from 'lucide-react'
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
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Hamkasb.AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-Коллега для банков и организаций — революционное решение для автоматизации бизнес-процессов
            </p>
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

          {/* CTA Section */}
          <div className="text-center">
            <Card className="border-2 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Готовы попробовать?</h2>
                <p className="text-muted-foreground mb-6">
                  Перейдите в панель управления и начните работу с AI-агентами
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

