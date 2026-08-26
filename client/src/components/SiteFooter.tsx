export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60 py-10">
      <div className="tarot-page max-w-3xl text-center text-sm text-muted-foreground">
        <p className="font-serif italic">
          Las lecturas son una herramienta de reflexión y acompañamiento. No reemplazan ayuda profesional.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed">
          Usamos tu email para identificar tu lectura gratuita, evitar usos repetidos y asociar tus créditos comprados. El consentimiento para recibir novedades es opcional, está separado del acceso a la lectura y podés retirarlo cuando quieras.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed">
          Al continuar aceptás este uso del email y los términos del servicio. No vendemos tu dirección ni la usamos para finalidades distintas a las informadas.
        </p>
        <p className="mt-3 text-xs tracking-wide">© {new Date().getFullYear()} · Tarot de Medianoche</p>
      </div>
    </footer>
  );
}
