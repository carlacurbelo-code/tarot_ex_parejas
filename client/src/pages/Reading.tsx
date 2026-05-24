import { SiteFooter } from "@/components/SiteFooter";
import { TarotCardView } from "@/components/TarotCardView";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ExternalLink, Heart, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useParams } from "wouter";

export default function Reading() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const orderQuery = trpc.tarot.getOrderByToken.useQuery(
    { token },
    { enabled: !!token, retry: false },
  );
  const priceQuery = trpc.tarot.getPremiumPrice.useQuery();

  if (orderQuery.isLoading || priceQuery.isLoading) {
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
          <h2 className="font-serif text-2xl">Lectura no encontrada</h2>
          <p className="mt-3 text-muted-foreground">
            Es posible que el enlace haya caducado o no sea correcto.
          </p>
        </div>
      </div>
    );
  }

  const order = orderQuery.data;
  const price = priceQuery.data?.priceUsd ?? "15";
  const paypalLink = priceQuery.data?.paypalLink ?? "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <section className="container max-w-2xl pt-10 pb-8 fade-in">
          <p className="text-center font-serif italic text-muted-foreground">Tu lectura</p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-center text-foreground leading-tight">
            Lo que dicen tus cartas
          </h1>

          <div className="mt-8 flex justify-center gap-3 sm:gap-4">
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

          <Card className="mt-10 p-6 sm:p-8 bg-card border-border/60 shadow-sm">
            <div className="font-serif text-base sm:text-lg leading-[1.85] text-foreground whitespace-pre-line">
              {order.freeReading}
            </div>
          </Card>
        </section>

        {order.paymentStatus !== "paid" && (
          <UpsellSection
            token={order.accessToken}
            price={price}
            paypalLink={paypalLink}
          />
        )}

        {order.paymentStatus === "paid" && (
          <Card className="container max-w-2xl mt-6 p-6 bg-secondary/40 border-border/60">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <p className="font-serif text-lg text-foreground">
                Tu lectura grabada está en proceso.
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Vas a recibir el audio en menos de 24 horas en tu mail.
              Podés revisar el estado de tu pedido cuando quieras.
            </p>
            <Button asChild variant="link" className="mt-2 px-0 h-auto">
              <a href={`/mi-lectura/${order.accessToken}`}>Ver el estado de mi lectura</a>
            </Button>
          </Card>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function UpsellSection({
  token,
  price,
  paypalLink,
}: {
  token: string;
  price: string;
  paypalLink: string;
}) {
  const [stage, setStage] = useState<"intro" | "form" | "confirming">("intro");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [paypalOrderId, setPaypalOrderId] = useState("");
  const confirm = trpc.tarot.confirmPayment.useMutation();

  const utils = trpc.useUtils();

  const validForPay = name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(email) && question.trim().length >= 10;

  const handleOpenPaypal = () => {
    if (!paypalLink) {
      toast.error("La pasarela de pago aún no está configurada. Volvé en un momento.");
      return;
    }
    const url = paypalLink.includes("?")
      ? `${paypalLink}/${encodeURIComponent(price)}USD`
      : `${paypalLink}/${encodeURIComponent(price)}USD`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleConfirm = async () => {
    if (!validForPay || !paypalOrderId.trim()) {
      toast.error("Completá tus datos y el código de la transacción de PayPal.");
      return;
    }
    setStage("confirming");
    try {
      await confirm.mutateAsync({
        token,
        paypalOrderId: paypalOrderId.trim(),
        amount: price,
        currency: "USD",
        clientName: name.trim(),
        clientEmail: email.trim(),
        premiumQuestion: question.trim(),
      });
      toast.success("¡Recibí tu pedido! En menos de 24h vas a tener tu lectura grabada.");
      utils.tarot.getOrderByToken.invalidate({ token });
    } catch (e: any) {
      toast.error("No pudimos confirmar el pago. Probá de nuevo o escribime.");
      console.error(e);
      setStage("form");
    }
  };

  return (
    <section className="container max-w-2xl pt-4 pb-16 fade-in">
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-secondary/60 to-card border-border/60 shadow-sm">
        <div className="flex items-center gap-2 text-primary">
          <Heart className="h-4 w-4 fill-primary/20" />
          <p className="text-xs font-medium uppercase tracking-widest">Si querés ir más profundo</p>
        </div>
        <h2 className="mt-3 font-serif text-2xl sm:text-3xl text-foreground leading-tight">
          Lectura grabada en audio,<br className="hidden sm:block" />
          íntima y personal.
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Recibís un audio privado donde leo tu vínculo con calma, en mi voz, con foco
          en la pregunta puntual que tengas. Llega a tu mail en menos de 24 horas.
        </p>

        <ul className="mt-6 space-y-3 text-sm text-foreground">
          <Bullet>Audio privado, hecho para vos</Bullet>
          <Bullet>Una pregunta puntual respondida con detalle</Bullet>
          <Bullet>Llega en menos de 24 horas</Bullet>
          <Bullet>Sin repreguntas ni complementos</Bullet>
        </ul>

        <div className="mt-7 flex items-baseline gap-2">
          <span className="font-serif text-4xl text-foreground">USD {price}</span>
          <span className="text-sm text-muted-foreground">precio único</span>
        </div>

        {stage === "intro" && (
          <Button
            onClick={() => setStage("form")}
            size="lg"
            className="mt-7 w-full h-12 text-base"
          >
            Quiero mi lectura grabada
          </Button>
        )}

        {(stage === "form" || stage === "confirming") && (
          <div className="mt-7 space-y-5 border-t border-border/50 pt-7">
            <div>
              <Label htmlFor="name" className="text-sm">Tu nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Cómo te llamás"
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm">Tu email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Para enviarte el audio"
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="question" className="text-sm">Tu pregunta puntual</Label>
              <Textarea
                id="question"
                value={question}
                maxLength={500}
                onChange={e => setQuestion(e.target.value)}
                placeholder="¿Qué necesitás entender o preguntar sobre tu vínculo?"
                className="mt-2 min-h-[110px] resize-none"
              />
            </div>

            <div className="rounded-lg border border-border/70 bg-card/60 p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Cómo es el pago:</p>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal pl-4">
                <li>Tocá el botón para pagar con PayPal (USD {price}).</li>
                <li>Cuando termines, copiá el ID de la transacción que te muestra PayPal.</li>
                <li>Volvé acá, pegalo abajo y confirmá. Yo recibo aviso en el momento.</li>
              </ol>
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenPaypal}
                className="w-full h-11 bg-[#0070BA] hover:bg-[#005ea6] text-white border-[#0070BA] hover:border-[#005ea6]"
              >
                Pagar con PayPal
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div>
              <Label htmlFor="paypalId" className="text-sm">ID de la transacción de PayPal</Label>
              <Input
                id="paypalId"
                value={paypalOrderId}
                onChange={e => setPaypalOrderId(e.target.value)}
                placeholder="Ej: 7VK912345A123456B"
                className="mt-2 h-11 font-mono text-sm"
              />
              <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Tus datos solo los veo yo.
              </p>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={!validForPay || !paypalOrderId.trim() || stage === "confirming"}
              size="lg"
              className="w-full h-12 text-base"
            >
              {stage === "confirming" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando</>
              ) : (
                "Confirmar mi pedido"
              )}
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60" />
      <span>{children}</span>
    </li>
  );
}
