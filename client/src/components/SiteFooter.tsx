export function SiteFooter() {
  return (
    <footer className="mt-20 py-10 border-t border-border/60">
      <div className="container max-w-3xl text-center text-sm text-muted-foreground">
        <p className="font-serif italic">
          Las lecturas son una herramienta de reflexión y acompañamiento. No reemplazan ayuda profesional.
        </p>
        <p className="mt-3 text-xs">© {new Date().getFullYear()} · Lecturas íntimas</p>
      </div>
    </footer>
  );
}
