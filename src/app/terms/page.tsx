import LegalLayout from '@/components/legal/LegalLayout'

export const metadata = {
  title: 'Términos de servicio · Funnel Labs',
}

export default function TermsPage() {
  return (
    <LegalLayout
      title="Términos de servicio"
      lastUpdated="13 de abril de 2026"
      breadcrumb="Términos de servicio"
      sections={[
        {
          number: '1',
          title: 'Aceptación de los términos',
          content: (
            <p>
              Al crear una cuenta o usar FunnelLab, aceptás estos términos de servicio. Si no estás de acuerdo,
              no uses el servicio.
            </p>
          ),
        },
        {
          number: '2',
          title: 'Descripción del servicio',
          content: (
            <p>
              FunnelLab es una plataforma de simulación de funnels de marketing que permite a los usuarios mapear,
              simular y optimizar embudos de venta. El servicio incluye un motor de simulación, asistente de IA,
              y herramientas de colaboración según el plan contratado. FunnelLab es operado por{' '}
              <a href="https://bralto.io" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors underline underline-offset-2">
                Bralto
              </a>
              .
            </p>
          ),
        },
        {
          number: '3',
          title: 'Cuentas y registro',
          content: (
            <ul className="space-y-2 list-none">
              <li>— Debés proporcionar información veraz al registrarte</li>
              <li>— Sos responsable de mantener la seguridad de tu cuenta y contraseña</li>
              <li>— Debés ser mayor de 18 años para usar el servicio</li>
              <li>— Una persona o empresa puede tener múltiples cuentas pero cada cuenta debe tener un email único</li>
            </ul>
          ),
        },
        {
          number: '4',
          title: 'Planes y pagos',
          content: (
            <ul className="space-y-2 list-none">
              <li>— FunnelLab ofrece planes de suscripción mensual (Starter, Pro, Max) y packs de créditos de IA</li>
              <li>— Los pagos se procesan a través de Stripe</li>
              <li>— Las suscripciones se renuevan automáticamente cada mes</li>
              <li>— Los precios pueden cambiar con previo aviso de 30 días</li>
              <li>— Los créditos de IA incluidos en el plan se resetean cada mes y no se acumulan</li>
              <li>— Los créditos de IA comprados en packs no expiran</li>
            </ul>
          ),
        },
        {
          number: '5',
          title: 'Prueba gratuita',
          content: (
            <ul className="space-y-2 list-none">
              <li>— Los planes pagos pueden incluir un período de prueba gratuita de 7 días</li>
              <li>— La prueba gratuita solo está disponible una vez por usuario</li>
              <li>— Al finalizar la prueba, se cobra automáticamente el precio del plan seleccionado</li>
              <li>— Podés cancelar antes de que termine la prueba para no ser cobrado</li>
            </ul>
          ),
        },
        {
          number: '6',
          title: 'Política de no devoluciones',
          content: (
            <ul className="space-y-2 list-none">
              <li>— Todas las ventas son finales. No se realizan reembolsos ni devoluciones una vez procesado el pago.</li>
              <li>— Esto aplica tanto a suscripciones mensuales como a packs de créditos de IA.</li>
              <li>— Si cancelás tu suscripción, mantenés el acceso hasta el final del período ya pagado, pero no se devuelve el monto del período actual.</li>
              <li>— En caso de cobros duplicados o errores de facturación comprobables, contactanos a soporte para resolverlo.</li>
            </ul>
          ),
        },
        {
          number: '7',
          title: 'Cancelación',
          content: (
            <ul className="space-y-2 list-none">
              <li>— Podés cancelar tu suscripción en cualquier momento desde tu cuenta o el portal de facturación</li>
              <li>— Al cancelar, mantenés el acceso a tu plan hasta el final del período de facturación actual</li>
              <li>— Después de la cancelación, tu cuenta pasa a plan Starter (gratuito con funcionalidades limitadas)</li>
              <li>— Tus proyectos y datos se mantienen durante 90 días después de la cancelación. Después de ese período, pueden ser eliminados.</li>
            </ul>
          ),
        },
        {
          number: '8',
          title: 'Uso aceptable',
          content: (
            <>
              <p className="mb-3">No podés usar FunnelLab para:</p>
              <ul className="space-y-2 list-none">
                <li>— Actividades ilegales o fraudulentas</li>
                <li>— Compartir tu cuenta con terceros no autorizados</li>
                <li>— Intentar acceder a cuentas de otros usuarios</li>
                <li>— Interferir con el funcionamiento del servicio</li>
                <li>— Usar el servicio para enviar spam o contenido malicioso</li>
                <li>— Revender el acceso al servicio sin autorización</li>
              </ul>
            </>
          ),
        },
        {
          number: '9',
          title: 'Propiedad intelectual',
          content: (
            <ul className="space-y-2 list-none">
              <li>— FunnelLab, su diseño, código y funcionalidades son propiedad de Bralto</li>
              <li>— Los funnels y datos que creés dentro de FunnelLab son tuyos</li>
              <li>— Al usar el servicio, nos otorgás permiso para almacenar y procesar tus datos según sea necesario para proveer el servicio</li>
            </ul>
          ),
        },
        {
          number: '10',
          title: 'Asistente de IA',
          content: (
            <ul className="space-y-2 list-none">
              <li>— El asistente de IA de FunnelLab proporciona sugerencias y análisis basados en los datos de tu funnel</li>
              <li>— Las recomendaciones de la IA son orientativas y no garantizan resultados específicos</li>
              <li>— Los créditos de IA se consumen al usar las funcionalidades de IA, independientemente de la calidad o utilidad de la respuesta</li>
              <li>— FunnelLab no es responsable de decisiones de negocio tomadas basándose en las sugerencias de la IA</li>
            </ul>
          ),
        },
        {
          number: '11',
          title: 'Disponibilidad del servicio',
          content: (
            <ul className="space-y-2 list-none">
              <li>— Nos esforzamos por mantener FunnelLab disponible 24/7, pero no garantizamos disponibilidad ininterrumpida</li>
              <li>— Podemos realizar mantenimientos programados con previo aviso</li>
              <li>— No somos responsables por pérdidas causadas por interrupciones del servicio</li>
            </ul>
          ),
        },
        {
          number: '12',
          title: 'Limitación de responsabilidad',
          content: (
            <ul className="space-y-2 list-none">
              <li>— FunnelLab es una herramienta de simulación y planificación. Los resultados simulados son estimaciones basadas en los datos ingresados y no garantizan resultados reales</li>
              <li>— Bralto no es responsable por pérdidas financieras, lucro cesante o daños derivados del uso del servicio</li>
              <li>— Nuestra responsabilidad máxima se limita al monto pagado por el usuario en los últimos 3 meses</li>
            </ul>
          ),
        },
        {
          number: '13',
          title: 'Modificaciones',
          content: (
            <ul className="space-y-2 list-none">
              <li>— Podemos modificar estos términos en cualquier momento</li>
              <li>— Notificaremos cambios significativos por email o dentro de la plataforma</li>
              <li>— El uso continuado del servicio después de los cambios implica aceptación</li>
            </ul>
          ),
        },
        {
          number: '14',
          title: 'Contacto',
          content: (
            <p>
              Para consultas sobre estos términos, contactanos en{' '}
              <a href="mailto:hola@bralto.io" className="text-white/70 hover:text-white transition-colors underline underline-offset-2">
                hola@bralto.io
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  )
}
