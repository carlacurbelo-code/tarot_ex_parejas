export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60 py-10">
      <div className="tarot-page max-w-3xl text-center text-sm text-muted-foreground">
        <p className="font-serif italic">
          Las lecturas son una herramienta de reflexión y acompañamiento. No reemplazan ayuda profesional.
        </p>
        <p className="mt-4 text-xs">
          <a href="/privacidad" className="underline decoration-muted-foreground/45 underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Privacidad</a>
        </p>
        <p className="mt-3 text-xs tracking-wide">© {new Date().getFullYear()} · Tarot de Medianoche</p>
      </div>
    </footer>
  );
}
