export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60 py-10">
      <div className="tarot-page max-w-3xl text-center text-sm text-muted-foreground">
        <p className="font-serif italic">
          Las lecturas son una herramienta de reflexión y acompañamiento. No reemplazan ayuda profesional.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed">
          La primera lectura se limita mediante una cookie anónima de primera parte, sin crear una cuenta ni usar técnicas invasivas de identificación. Para prevenir automatización evidente, aplicamos además un límite temporal por conexión.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed">
          Solo pedimos tu email si comprás créditos, para asociarlos a la compra. El consentimiento para recibir novedades es opcional, separado del pago y podés retirarlo cuando quieras. No vendemos tu dirección ni la usamos para finalidades distintas a las informadas.
        </p>
        <p className="mt-3 text-xs tracking-wide">© {new Date().getFullYear()} · Tarot de Medianoche</p>
      </div>
    </footer>
  );
}
