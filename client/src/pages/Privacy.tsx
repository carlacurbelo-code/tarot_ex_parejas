import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Privacy() {
  return (
    <div className="tarot-shell flex min-h-screen flex-col">
      <main className="tarot-page max-w-2xl flex-1 py-10 sm:py-20">
        <Link href="/">
          <Button variant="ghost" className="-ml-2 text-muted-foreground hover:bg-transparent hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
        </Link>
        <article className="tarot-surface mt-7 px-5 py-9 sm:px-10 sm:py-12">
          <p className="tarot-kicker">Tarot de Medianoche</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground sm:text-5xl">Privacidad</h1>
          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <section>
              <h2 className="font-serif text-2xl text-foreground">Lectura gratuita</h2>
              <p className="mt-2">Para limitar la primera lectura gratuita usamos una cookie anónima de primera parte. Su valor es aleatorio, no contiene datos personales, es HttpOnly y se conserva hasta un año. En la base de datos sólo se guarda un hash de ese valor y la fecha en que se utilizó el beneficio.</p>
            </section>
            <section>
              <h2 className="font-serif text-2xl text-foreground">Prevención de abuso</h2>
              <p className="mt-2">Como medida adicional de seguridad, guardamos temporalmente un hash de la conexión para detectar automatización evidente. El límite es de 12 identificadores nuevos por conexión cada hora. No utilizamos fingerprinting de hardware, canvas, fuentes instaladas ni seguimiento entre sitios.</p>
            </section>
            <section>
              <h2 className="font-serif text-2xl text-foreground">Compras y email</h2>
              <p className="mt-2">El email se solicita sólo al comprar créditos, para asociar la compra y los créditos a esa operación. El consentimiento para recibir novedades es opcional, independiente y podés retirarlo cuando quieras. No vendemos tu email ni lo usamos para finalidades distintas de las informadas.</p>
            </section>
            <section>
              <h2 className="font-serif text-2xl text-foreground">Alcance</h2>
              <p className="mt-2">Las lecturas son una herramienta de reflexión y acompañamiento. No constituyen asesoramiento médico, legal, financiero ni de salud mental.</p>
            </section>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
