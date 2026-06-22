import type { Metadata } from 'next'
import Link from 'next/link'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'Política de Privacidad — One Padel Academy',
  description: 'Política de privacidad y tratamiento de datos personales de One Padel Academy conforme a la Ley 1581 de 2012.',
}

const UPDATED = '27 de mayo de 2026'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-8">
          <p className="text-xs font-semibold text-brand uppercase tracking-widest">Legal</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">Política de Privacidad</h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: <span className="text-foreground">{UPDATED}</span>
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            En <strong className="text-foreground">One Padel Academy</strong> nos comprometemos a
            proteger la privacidad y la confidencialidad de los datos personales de nuestros usuarios,
            conforme a la <strong className="text-foreground">Ley 1581 de 2012</strong> de Protección
            de Datos Personales y el{' '}
            <strong className="text-foreground">Decreto 1377 de 2013</strong> de la República de Colombia.
          </p>
        </div>

        {/* 1. Responsable */}
        <Section title="1. Responsable del tratamiento">
          <p>
            El responsable del tratamiento de sus datos personales es:
          </p>
          <div className="bg-muted/30 rounded-lg px-4 py-3 space-y-1 text-sm">
            <p><strong className="text-foreground">One Padel Academy</strong></p>
            <p>Barranquilla, Atlántico, Colombia</p>
            <p>Correo de contacto:{' '}
              <a href="mailto:juansedanotri@gmail.com" className="text-brand hover:underline">
                juansedanotri@gmail.com
              </a>
            </p>
          </div>
        </Section>

        {/* 2. Datos recopilados */}
        <Section title="2. Datos personales que recopilamos">
          <p>
            Al registrarse y utilizar nuestra plataforma, recopilamos los siguientes datos personales:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong className="text-foreground">Identificación:</strong> nombre completo y número de documento de identidad (cédula, pasaporte u otro).</li>
            <li><strong className="text-foreground">Contacto:</strong> correo electrónico y número de teléfono.</li>
            <li><strong className="text-foreground">Datos demográficos:</strong> fecha de nacimiento y dirección de residencia.</li>
            <li><strong className="text-foreground">Datos deportivos:</strong> nivel de juego, historial de evaluaciones físico-técnicas y progreso en la academia.</li>
            <li><strong className="text-foreground">Datos transaccionales:</strong> historial de reservas, pagos y movimientos en la E-Wallet.</li>
          </ul>
          <p>
            No recopilamos datos sensibles como información de salud, datos biométricos, filiación
            política o religiosa, salvo los datos deportivos mencionados que son necesarios para
            la prestación del servicio.
          </p>
        </Section>

        {/* 3. Finalidad */}
        <Section title="3. Finalidad del tratamiento">
          <p>Sus datos personales se utilizan exclusivamente para las siguientes finalidades:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Gestión del registro y autenticación en la plataforma.</li>
            <li>Administración de membresías, reservas de canchas y grupos de entrenamiento.</li>
            <li>Procesamiento de pagos y control de saldos en la E-Wallet.</li>
            <li>Comunicaciones relacionadas con el servicio: confirmaciones de reserva, recordatorios, notificaciones de cambios.</li>
            <li>Evaluaciones deportivas y seguimiento del progreso técnico de cada jugador.</li>
            <li>Organización y participación en torneos internos.</li>
            <li>Mejora de nuestros servicios mediante análisis agregados y anónimos de uso de la plataforma.</li>
          </ul>
        </Section>

        {/* 4. No venta de datos */}
        <Section title="4. No venta ni cesión de datos a terceros">
          <p>
            <strong className="text-foreground">One Padel Academy no vende, alquila ni cede</strong> sus
            datos personales a terceros con fines comerciales o de cualquier otra índole.
          </p>
          <p>
            Sus datos únicamente podrán ser compartidos en los siguientes casos excepcionales:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Por requerimiento expreso de autoridad judicial o administrativa competente, conforme a la ley colombiana.</li>
            <li>Con proveedores de servicios tecnológicos (p. ej. alojamiento en la nube) que actúan como encargados del tratamiento bajo acuerdos de confidencialidad.</li>
          </ul>
        </Section>

        {/* 5. Seguridad */}
        <Section title="5. Medidas de seguridad">
          <p>
            Implementamos medidas técnicas y organizativas adecuadas para proteger sus datos personales
            contra accesos no autorizados, pérdida, destrucción o alteración accidental. Entre ellas:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Cifrado de contraseñas y comunicaciones mediante protocolo HTTPS.</li>
            <li>Control de acceso basado en roles (administrador, entrenador, jugador).</li>
            <li>Almacenamiento en infraestructura cloud con certificaciones de seguridad.</li>
          </ul>
        </Section>

        {/* 6. Derechos */}
        <Section title="6. Derechos del titular de los datos">
          <p>
            Conforme a la Ley 1581 de 2012, usted tiene los siguientes derechos sobre sus datos personales:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong className="text-foreground">Acceso:</strong> conocer qué datos personales suyos tenemos almacenados.</li>
            <li><strong className="text-foreground">Rectificación:</strong> solicitar la corrección de datos inexactos o incompletos.</li>
            <li><strong className="text-foreground">Supresión:</strong> solicitar la eliminación de sus datos cuando ya no sean necesarios para la finalidad para la que fueron recopilados, salvo obligación legal de conservación.</li>
            <li><strong className="text-foreground">Revocación del consentimiento:</strong> retirar en cualquier momento el consentimiento otorgado para el tratamiento de sus datos.</li>
            <li><strong className="text-foreground">Oposición:</strong> oponerse al tratamiento de sus datos en casos específicos previstos por la ley.</li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, envíe su solicitud al correo:{' '}
            <a href="mailto:juansedanotri@gmail.com" className="text-brand hover:underline font-medium">
              juansedanotri@gmail.com
            </a>
            {' '}indicando su nombre completo, documento de identidad y el derecho que desea ejercer.
            Le responderemos en un plazo máximo de <strong className="text-foreground">10 días hábiles</strong>.
          </p>
        </Section>

        {/* 7. Conservación */}
        <Section title="7. Conservación de los datos">
          <p>
            Sus datos personales serán conservados durante el tiempo que mantenga su cuenta activa en
            la plataforma y mientras exista una relación contractual vigente. Una vez finalizada dicha
            relación, los datos se conservarán durante el período mínimo exigido por la normativa
            colombiana aplicable.
          </p>
        </Section>

        {/* 8. Marco legal */}
        <Section title="8. Marco legal aplicable">
          <p>
            Esta Política de Privacidad se rige por la legislación colombiana, en particular:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong className="text-foreground">Ley 1581 de 2012</strong> — Disposiciones generales para la protección de datos personales.</li>
            <li><strong className="text-foreground">Decreto 1377 de 2013</strong> — Reglamentación parcial de la Ley 1581 de 2012.</li>
            <li><strong className="text-foreground">Ley 1266 de 2008</strong> — Habeas data financiero.</li>
          </ul>
        </Section>

        {/* 9. Modificaciones */}
        <Section title="9. Cambios en la política de privacidad">
          <p>
            One Padel Academy puede actualizar esta Política de Privacidad en cualquier momento para
            reflejar cambios en nuestras prácticas o en la normativa vigente. Cualquier modificación
            sustancial será notificada a los usuarios registrados por correo electrónico con un mínimo
            de <strong className="text-foreground">15 días de anticipación</strong>.
          </p>
        </Section>

        {/* 10. Contacto */}
        <Section title="10. Contacto">
          <p>
            Para cualquier consulta, solicitud o reclamación relacionada con el tratamiento de sus
            datos personales, puede contactarnos en:
          </p>
          <div className="bg-muted/30 rounded-lg px-4 py-3 text-sm space-y-1">
            <p><strong className="text-foreground">One Padel Academy</strong></p>
            <p>Barranquilla, Atlántico, Colombia</p>
            <p>
              Correo:{' '}
              <a href="mailto:juansedanotri@gmail.com" className="text-brand hover:underline">
                juansedanotri@gmail.com
              </a>
            </p>
          </div>
        </Section>

        {/* Footer note */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-4 justify-between text-xs text-muted-foreground">
          <span>One Padel Academy — Barranquilla, Colombia</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">Términos y Condiciones</Link>
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
