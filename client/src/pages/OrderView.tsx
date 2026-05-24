import { SiteFooter } from "@/components/SiteFooter";
import { TarotCardView } from "@/components/TarotCardView";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useParams } from "wouter";

export default function OrderView() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const orderQuery = trpc.tarot.getOrderByToken.useQuery(
    { token },
    { enabled: !!token, retry: false, refetchInterval: 30000 },
  );

  if (orderQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (orderQuery.error || !orderQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="font-serif text-2xl">No encontramos tu pedido</h2>
          <p className="mt-3 text-muted-foreground">
            Revisá el enlace o escribime para que te ayude.
          </p>
        </div>
      </div>
    );
  }

  const order = orderQuery.data;
  const isPaid = order.paymentStatus === "paid";
  const isCompleted = order.deliveryStatus === "completed" && !!order.audioFileKey;
  const audioUrl = order.audioFileKey ? `/manus-storage/${order.audioFileKey}` : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <section className="container max-w-2xl pt-12 pb-12 fade-in">
          <p className="text-center font-serif italic text-muted-foreground">Tu pedido</p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-center leading-tight">
            {isCompleted ? "Tu lectura está lista" : "Tu lectura está en proceso"}
          </h1>

          <div className="mt-8 flex justify-center gap-3">
            {order.cards.map(card => (
              <TarotCardView
                key={card.id}
                name={card.name}
                emoji={card.emoji}
                revealed
                size="sm"
              />
            ))}
          </div>

          <Card className="mt-8 p-6 bg-card border-border/60">
            {!isPaid && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-serif text-lg">Aún no recibimos tu pago</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Si ya pagaste, esperá unos minutos y refrescá esta página.
                  </p>
                </div>
              </div>
            )}

            {isPaid && !isCompleted && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-serif text-lg">Estoy preparando tu audio</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Recibimos tu pago. La lectura grabada llega en menos de 24 horas.
                    Te aviso por mail cuando esté lista.
                  </p>
                </div>
              </div>
            )}

            {isCompleted && audioUrl && (
              <div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-serif text-lg">Tu lectura grabada</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Escuchala con tiempo y sin apuro.
                    </p>
                  </div>
                </div>
                <audio
                  src={audioUrl}
                  controls
                  className="mt-5 w-full rounded-md"
                  preload="metadata"
                />
                <a
                  href={audioUrl}
                  download
                  className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
                >
                  Descargar el audio
                </a>
              </div>
            )}
          </Card>

          {order.freeReading && (
            <Card className="mt-6 p-6 bg-secondary/30 border-border/60">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Tu lectura inicial</p>
              <div className="mt-3 font-serif text-base leading-[1.85] text-foreground whitespace-pre-line">
                {order.freeReading}
              </div>
            </Card>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
