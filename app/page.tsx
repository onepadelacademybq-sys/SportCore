import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/landing/nav'
import { Hero } from '@/components/landing/hero'
import { Stats } from '@/components/landing/stats'
import { Mission } from '@/components/landing/mission'
import { Services } from '@/components/landing/services'
import { Pricing } from '@/components/landing/pricing'
import { GroupsSection } from '@/components/landing/groups-section'
import { ContactForm } from '@/components/landing/contact-form'
import { Footer } from '@/components/landing/footer'
import { MapPin, Clock, Mail, Phone } from 'lucide-react'

const ROLE_DASHBOARD = {
  admin:  '/admin/dashboard',
  coach:  '/coach/dashboard',
  player: '/player/dashboard',
} as const

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = (data as { role?: string } | null)?.role as keyof typeof ROLE_DASHBOARD | undefined
    if (role && role in ROLE_DASHBOARD) redirect(ROLE_DASHBOARD[role])
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main>
        <Hero />
        <Stats />
        <Mission />
        <Services />
        <Pricing />
        <GroupsSection />

        {/* Contacto */}
        <section id="contacto" className="py-24 px-6 bg-muted/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs text-brand uppercase tracking-widest font-semibold mb-3">
                Hablemos
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
                ¿Listo para empezar?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm">
                Escríbenos y un entrenador te contactará para guiarte en el proceso de inscripción.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-start">
              {/* Info de contacto */}
              <div className="space-y-8">
                <div className="space-y-5">
                  {[
                    {
                      icon: MapPin,
                      label: 'Ubicación',
                      content: (
                        <a
                          href="https://share.google/Z9wdHleldl0AQOwma"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:text-brand transition-colors"
                        >
                          Casa Pádel, Barranquilla, Colombia
                        </a>
                      ),
                    },
                    {
                      icon: Clock,
                      label: 'Horario',
                      content: (
                        <p className="text-sm whitespace-pre-line">
                          {'Lun – Vie  5:00 am – 10:00 pm\nSáb, Dom y festivos  8:00 am – 3:00 pm'}
                        </p>
                      ),
                    },
                    {
                      icon: Mail,
                      label: 'Email',
                      content: (
                        <a
                          href="mailto:onepadelacademybq@gmail.com"
                          className="text-sm hover:text-brand transition-colors"
                        >
                          onepadelacademybq@gmail.com
                        </a>
                      ),
                    },
                    {
                      icon: Phone,
                      label: 'WhatsApp',
                      content: (
                        <a
                          href="https://wa.me/573016575440"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:text-brand transition-colors"
                        >
                          +57 301 657 5440
                        </a>
                      ),
                    },
                  ].map(({ icon: Icon, label, content }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-brand" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                        {content}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border bg-card p-5 space-y-2">
                  <p className="text-sm font-medium">Síguenos en redes</p>
                  <p className="text-xs text-muted-foreground">
                    Contenido de entrenamientos, tips técnicos y noticias de la academia.
                  </p>
                  <a
                    href="https://instagram.com/1padelbaq"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand font-medium pt-1 hover:underline block"
                  >
                    @1padelbaq
                  </a>
                </div>
              </div>

              {/* Formulario */}
              <div className="rounded-2xl border border-border bg-card p-8">
                <h3 className="font-heading text-lg font-semibold mb-6">Envíanos un mensaje</h3>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
