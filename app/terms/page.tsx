import type { Metadata } from 'next'
import Link from 'next/link'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — One Padel Academy',
  description: 'Términos y condiciones de uso de la plataforma y servicios de One Padel Academy.',
}

const UPDATED = '27 de mayo de 2026'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-8">
          <p className="text-xs font-semibold text-[#00C4CC] uppercase tracking-widest">Legal</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">Términos y Condiciones</h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: <span className="text-foreground">{UPDATED}</span>
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Al acceder y utilizar la plataforma de <strong className="text-foreground">One Padel Academy</strong>,
            usted acepta de forma expresa los presentes Términos y Condiciones. Si no está de acuerdo con alguna
            de estas disposiciones, le pedimos que no utilice nuestros servicios.
          </p>
        </div>

        {/* 1. Identificación */}
        <Section title="1. Identificación del responsable">
          <p>
            <strong>One Padel Academy</strong> es una academia de pádel con sede en Barranquilla,
            Colombia. Para cualquier consulta puede contactarnos en:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Correo: <a href="mailto:onepadelacademybq@gmail.com" className="text-foreground hover:underline">onepadelacademybq@gmail.com</a></li>
            <li>Ubicación: Barranquilla, Atlántico, Colombia</li>
          </ul>
        </Section>

        {/* 2. Uso de la plataforma */}
        <Section title="2. Uso de la plataforma y servicios">
          <p>
            La plataforma de One Padel Academy está diseñada para la gestión integral de membresías,
            reservas de canchas, grupos de entrenamiento, torneos y evaluaciones deportivas.
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>El acceso es exclusivo para personas mayores de 18 años o menores con autorización de su representante legal.</li>
            <li>Las credenciales de acceso son personales e intransferibles. El usuario es responsable de mantener la confidencialidad de su contraseña.</li>
            <li>Queda prohibido el uso de la plataforma para fines ilícitos, fraudulentos o que contravengan estos términos.</li>
            <li>One Padel Academy se reserva el derecho de suspender o cancelar cuentas que infrinjan estas condiciones.</li>
          </ul>
        </Section>

        {/* 3. Reservas y cancelaciones */}
        <Section title="3. Política de reservas y cancelaciones">
          <p>
            Las reservas de canchas están sujetas a disponibilidad y se gestionan a través de la plataforma
            con los siguientes términos:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Las reservas deben realizarse con un mínimo de 2 horas de anticipación.</li>
            <li>
              <strong className="text-foreground">Cancelaciones sin cargo:</strong> el usuario puede
              cancelar sin penalidad hasta <strong className="text-foreground">24 horas antes</strong> del
              horario reservado.
            </li>
            <li>
              <strong className="text-foreground">Cancelaciones tardías:</strong> las cancelaciones
              realizadas con menos de 24 horas de anticipación no generan devolución alguna.
            </li>
            <li>
              Los créditos generados por cancelaciones elegibles se reembolsan a la{' '}
              <strong className="text-foreground">E-Wallet</strong> del usuario dentro de la plataforma y
              podrán ser utilizados en futuras reservas.
            </li>
            <li>
              <strong className="text-foreground">No se realizan devoluciones en efectivo</strong> ni
              transferencias bancarias por cancelaciones. El único mecanismo de compensación es el crédito a E-Wallet.
            </li>
          </ul>
        </Section>

        {/* 4. Pagos */}
        <Section title="4. Política de pagos">
          <p>
            Los pagos de reservas, membresías y torneos se realizan mediante los métodos habilitados
            en la plataforma:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Transferencia bancaria, Nequi o Daviplata a las cuentas indicadas por One Padel Academy.</li>
            <li>Los pagos son verificados manualmente por un administrador. El servicio se activa una vez confirmado el pago.</li>
            <li>Las tarifas vigentes se muestran en la plataforma y pueden actualizarse con previo aviso al usuario.</li>
            <li>
              El saldo de la <strong className="text-foreground">E-Wallet</strong> es un crédito interno de la
              plataforma, no tiene valor monetario fuera de ella y no puede ser retirado en efectivo.
            </li>
          </ul>
        </Section>

        {/* 5. Grupos */}
        <Section title="5. Política de grupos de entrenamiento">
          <p>
            Los grupos de entrenamiento operan bajo un ciclo mensual de facturación con las siguientes condiciones:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>El pago de la mensualidad debe realizarse dentro de los primeros días del mes correspondiente.</li>
            <li>
              <strong className="text-foreground">Mora:</strong> transcurridos 4 días hábiles desde la
              fecha de vencimiento sin recibir el pago, se aplicará un recargo por mora del{' '}
              <strong className="text-foreground">10%</strong> sobre el valor de la mensualidad.
            </li>
            <li>El acceso a las clases grupales puede suspenderse hasta que se regularice el pago pendiente.</li>
            <li>One Padel Academy notificará los vencimientos con anticipación a través de la plataforma y/o correo electrónico.</li>
          </ul>
        </Section>

        {/* 6. Exoneración de responsabilidad */}
        <Section title="6. Exoneración de responsabilidad por actividad deportiva">
          <p>
            El pádel es una actividad deportiva que implica riesgos inherentes. Al utilizar nuestras
            instalaciones y servicios, el usuario:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>
              Reconoce que las lesiones deportivas son un riesgo asumido de forma libre y voluntaria,
              y libera a One Padel Academy de responsabilidad por daños físicos derivados de la práctica deportiva.
            </li>
            <li>
              Se recomienda someterse a un examen médico previo al inicio de actividades, especialmente
              para personas con condiciones de salud preexistentes.
            </li>
            <li>
              One Padel Academy no se responsabiliza por la pérdida, hurto o daño de objetos personales
              en las instalaciones.
            </li>
            <li>
              En caso de emergencia médica, nuestro personal seguirá los protocolos de primeros auxilios
              y contactará a los servicios de emergencias correspondientes.
            </li>
          </ul>
        </Section>

        {/* 7. Datos personales */}
        <Section title="7. Protección de datos personales">
          <p>
            One Padel Academy trata los datos personales de sus usuarios conforme a la{' '}
            <strong className="text-foreground">Ley 1581 de 2012</strong> (Protección de Datos Personales)
            y el <strong className="text-foreground">Decreto 1377 de 2013</strong> de la República de Colombia.
          </p>
          <p>
            Para conocer en detalle qué datos recopilamos, cómo los utilizamos y los derechos que le
            asisten, consulte nuestra{' '}
            <Link href="/privacy" className="text-[#00C4CC] hover:underline font-medium">
              Política de Privacidad
            </Link>
            .
          </p>
        </Section>

        {/* 8. Propiedad intelectual */}
        <Section title="8. Propiedad intelectual">
          <p>
            Todos los contenidos de la plataforma — incluyendo textos, gráficos, logotipos, íconos,
            fotografías, vídeos, software y diseño — son propiedad exclusiva de{' '}
            <strong className="text-foreground">One Padel Academy</strong> o de sus licenciantes y están
            protegidos por las leyes colombianas e internacionales de propiedad intelectual.
          </p>
          <p>
            Queda prohibida la reproducción, distribución, modificación o explotación comercial de
            cualquier contenido de la plataforma sin autorización previa y expresa por escrito.
          </p>
        </Section>

        {/* 9. Modificaciones */}
        <Section title="9. Modificaciones a los términos">
          <p>
            One Padel Academy se reserva el derecho de modificar estos Términos y Condiciones en
            cualquier momento. Los cambios se notificarán a los usuarios registrados mediante correo
            electrónico con un mínimo de <strong className="text-foreground">15 días de anticipación</strong>.
          </p>
          <p>
            El uso continuado de la plataforma tras la entrada en vigor de las modificaciones implica
            la aceptación de los nuevos términos.
          </p>
        </Section>

        {/* 10. Ley aplicable */}
        <Section title="10. Ley aplicable y jurisdicción">
          <p>
            Los presentes Términos y Condiciones se rigen por las leyes de la República de Colombia.
            Cualquier controversia que surja en relación con su interpretación o cumplimiento será
            sometida a los tribunales competentes de la ciudad de Barranquilla, Colombia.
          </p>
        </Section>

        {/* Footer note */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-4 justify-between text-xs text-muted-foreground">
          <span>One Padel Academy — Barranquilla, Colombia</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Política de Privacidad</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Volver al inicio</Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  )
}
