import LegalLayout from '@/components/legal/LegalLayout'

export const metadata = {
  title: 'Política de privacidad · Funnel Labs',
}

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Política de privacidad"
      lastUpdated="13 de abril de 2026"
      breadcrumb="Política de privacidad"
      sections={[
        {
          number: '1',
          title: 'Información que recopilamos',
          content: (
            <>
              <p className="font-medium text-[#aaa] mb-2">Datos que nos proporcionás directamente:</p>
              <ul className="space-y-1.5 list-none mb-4">
                <li>— Nombre y email al registrarte</li>
                <li>— Información de pago (procesada por Stripe, no almacenamos datos de tarjeta)</li>
                <li>— Datos de tus proyectos y funnels dentro de FunnelLab</li>
              </ul>
              <p className="font-medium text-[#aaa] mb-2">Datos que recopilamos automáticamente:</p>
              <ul className="space-y-1.5 list-none">
                <li>— Dirección IP y ubicación aproximada</li>
                <li>— Tipo de navegador y dispositivo</li>
                <li>— Páginas visitadas y acciones dentro de la plataforma</li>
                <li>— Cookies de sesión y autenticación</li>
              </ul>
            </>
          ),
        },
        {
          number: '2',
          title: 'Cómo usamos tu información',
          content: (
            <ul className="space-y-2 list-none">
              <li>— Para proveer y mantener el servicio</li>
              <li>— Para procesar pagos y administrar tu suscripción</li>
              <li>— Para enviar comunicaciones relacionadas con tu cuenta (confirmaciones, alertas de pago, cambios en el servicio)</li>
              <li>— Para mejorar el servicio y desarrollar nuevas funcionalidades</li>
              <li>— Para el funcionamiento del asistente de IA (tus datos de funnel se envían a proveedores de IA para generar respuestas)</li>
              <li>— Para soporte al cliente</li>
            </ul>
          ),
        },
        {
          number: '3',
          title: 'Asistente de IA y tus datos',
          content: (
            <ul className="space-y-2 list-none">
              <li>— Cuando usás el asistente de IA, los datos de tu funnel actual (nodos, conexiones, métricas) se envían a Anthropic (Claude) para procesar tu consulta</li>
              <li>— No compartimos tus datos con el proveedor de IA para fines de entrenamiento</li>
              <li>— Las conversaciones con la IA se almacenan en tu cuenta para mantener el historial</li>
              <li>— Podés eliminar tu historial de conversaciones en cualquier momento</li>
            </ul>
          ),
        },
        {
          number: '4',
          title: 'Compartición de datos',
          content: (
            <>
              <p className="mb-3">No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto:</p>
              <ul className="space-y-2 list-none">
                <li>— <span className="text-[#aaa]">Stripe:</span> para procesar pagos</li>
                <li>— <span className="text-[#aaa]">Anthropic:</span> para el funcionamiento del asistente de IA (solo datos del funnel, no datos personales)</li>
                <li>— <span className="text-[#aaa]">Supabase:</span> como proveedor de infraestructura y base de datos</li>
                <li>— <span className="text-[#aaa]">Vercel:</span> como proveedor de hosting</li>
                <li>— Cuando sea requerido por ley o autoridad competente</li>
              </ul>
            </>
          ),
        },
        {
          number: '5',
          title: 'Seguridad',
          content: (
            <ul className="space-y-2 list-none">
              <li>— Usamos encriptación HTTPS para todas las comunicaciones</li>
              <li>— Los datos de pago son procesados por Stripe con certificación PCI DSS</li>
              <li>— Las contraseñas se almacenan encriptadas</li>
              <li>— Implementamos controles de acceso y autenticación seguros</li>
            </ul>
          ),
        },
        {
          number: '6',
          title: 'Retención de datos',
          content: (
            <ul className="space-y-2 list-none">
              <li>— Mantenemos tus datos mientras tu cuenta esté activa</li>
              <li>— Después de cancelar, mantenemos tus datos durante 90 días</li>
              <li>— Después de 90 días, tus datos pueden ser eliminados permanentemente</li>
              <li>— Podés solicitar la eliminación de tu cuenta y datos en cualquier momento contactándonos</li>
            </ul>
          ),
        },
        {
          number: '7',
          title: 'Tus derechos',
          content: (
            <>
              <p className="mb-3">Tenés derecho a:</p>
              <ul className="space-y-2 list-none">
                <li>— Acceder a tus datos personales</li>
                <li>— Corregir datos incorrectos</li>
                <li>— Solicitar la eliminación de tu cuenta y datos</li>
                <li>— Exportar tus datos (funnels y proyectos)</li>
                <li>— Cancelar tu suscripción en cualquier momento</li>
              </ul>
            </>
          ),
        },
        {
          number: '8',
          title: 'Cookies',
          content: (
            <>
              <p className="mb-3">Usamos cookies esenciales para:</p>
              <ul className="space-y-2 list-none mb-3">
                <li>— Mantener tu sesión activa</li>
                <li>— Recordar tus preferencias</li>
                <li>— Autenticación segura</li>
              </ul>
              <p>No usamos cookies de terceros para publicidad ni tracking.</p>
            </>
          ),
        },
        {
          number: '9',
          title: 'Menores de edad',
          content: (
            <p>
              FunnelLab no está dirigido a menores de 18 años. No recopilamos intencionalmente información de menores.
            </p>
          ),
        },
        {
          number: '10',
          title: 'Cambios en esta política',
          content: (
            <p>
              Podemos actualizar esta política de privacidad periódicamente. Notificaremos cambios significativos
              por email o dentro de la plataforma.
            </p>
          ),
        },
        {
          number: '11',
          title: 'Contacto',
          content: (
            <p>
              Para consultas sobre privacidad, contactanos en{' '}
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
