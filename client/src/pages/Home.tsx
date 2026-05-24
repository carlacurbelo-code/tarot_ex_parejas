import { SiteFooter } from "@/components/SiteFooter";
import { TarotCardView } from "@/components/TarotCardView";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import type { TarotCard } from "@shared/tarot";
import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type Step = "intro" | "form" | "cards" | "loading";

export default function Home() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("intro");
  const [situation, setSituation] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shuffledDeck, setShuffledDeck] = useState<TarotCard[]>([]);

  const deckQuery = trpc.tarot.getDeck.useQuery();
  const submit = trpc.tarot.submitReading.useMutation();

  useEffect(() => {
    if (deckQuery.data && shuffledDeck.length === 0) {
      const arr = [...deckQuery.data];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setShuffledDeck(arr.slice(0, 15));
    }
  }, [deckQuery.data, shuffledDeck.length]);

  const remainingPicks = 3 - selectedIds.length;

  const toggleCard = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.length !== 3) return;
    setStep("loading");
    try {
      const res = await submit.mutateAsync({
        situation: situation.trim(),
        cardIds: selectedIds,
      });
      navigate(`/lectura/${res.accessToken}`);
    } catch (e: any) {
      toast.error("No se pudo generar tu lectura. Intentá nuevamente.");
      console.error(e);
      setStep("cards");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {step === "intro" && <IntroSection onStart={() => setStep("form")} />}
        {step === "form" && (
          <FormSection
            value={situation}
            onChange={setSituation}
            onContinue={() => setStep("cards")}
          />
        )}
        {step === "cards" && (
          <CardsSection
            deck={shuffledDeck}
            selectedIds={selectedIds}
            remaining={remainingPicks}
            onToggle={toggleCard}
            onContinue={handleSubmit}
            loading={submit.isPending}
          />
        )}
        {step === "loading" && <LoadingSection />}
      </main>
      <SiteFooter />
    </div>
  );
}

function IntroSection({ onStart }: { onStart: () => void }) {
  return (
    <section className="container max-w-2xl pt-16 pb-12 sm:pt-24 fade-in">
      <div className="text-center">
        <p className="font-serif italic text-muted-foreground text-base sm:text-lg">
          Lecturas íntimas
        </p>
        <h1 className="mt-6 font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.1] tracking-tight text-foreground">
          ¿Tu ex todavía
          <br />
          <span className="italic text-primary">siente algo?</span>
        </h1>
        <p className="mt-7 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
          Contame lo que te pasa con esa persona y elegí tres cartas.
          Recibí ahora mismo una lectura íntima sobre tu vínculo.
        </p>
        <div className="mt-10">
          <Button
            onClick={onStart}
            size="lg"
            className="h-12 px-8 text-base font-medium"
          >
            Empezar mi lectura
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Lectura inicial gratuita · sin registro
          </p>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-3 gap-4 sm:gap-6 max-w-md mx-auto">
        {["☾", "♡", "✦"].map((s, i) => (
          <div
            key={i}
            className="aspect-[2/3] rounded-lg bg-gradient-to-br from-[oklch(0.42_0.04_240)] to-[oklch(0.32_0.035_245)] flex items-center justify-center text-3xl text-[oklch(0.78_0.045_55)]/70 shadow-sm"
            style={{ animation: `fadeIn 0.8s ${i * 0.15}s both cubic-bezier(0.23, 1, 0.32, 1)` }}
          >
            {s}
          </div>
        ))}
      </div>

      <div className="mt-20 max-w-xl mx-auto text-center">
        <h2 className="font-serif text-2xl text-foreground">Cómo funciona</h2>
        <div className="mt-8 space-y-6 text-left">
          <Step n={1} title="Contame brevemente">
            En pocas palabras, qué pasa con tu ex y qué necesitás entender.
          </Step>
          <Step n={2} title="Elegí tres cartas">
            De un mazo cuidado, sin apuro. Las que sientas.
          </Step>
          <Step n={3} title="Recibí tu lectura">
            Una interpretación íntima escrita para vos. Si querés ir más profundo,
            podés sumar una lectura grabada en audio.
          </Step>
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary font-serif text-lg flex items-center justify-center">
        {n}
      </div>
      <div>
        <p className="font-serif text-lg text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function FormSection({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
}) {
  const remaining = 800 - value.length;
  const canContinue = value.trim().length >= 10;

  return (
    <section className="container max-w-xl pt-12 pb-12 sm:pt-20 fade-in">
      <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-foreground">
        Contame qué te pasa
      </h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        En pocas palabras: qué pasó, cómo terminaron, qué te ronda.
        Mientras más auténtica seas, más íntima será la lectura.
      </p>

      <Card className="mt-7 p-5 bg-card border-border/70 shadow-sm">
        <Label htmlFor="situation" className="text-sm font-medium text-foreground">
          Tu situación
        </Label>
        <Textarea
          id="situation"
          value={value}
          maxLength={800}
          onChange={e => onChange(e.target.value)}
          placeholder="Hace tres meses cortamos. Habíamos estado juntos casi dos años. Últimamente sueño mucho con él, no entiendo si lo extraño o si todavía estoy enojada..."
          className="mt-3 min-h-[200px] resize-none text-base leading-relaxed border-input/70 focus-visible:ring-primary/40"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{value.trim().length < 10 ? "Escribí al menos un par de líneas" : "Listo cuando quieras"}</span>
          <span>{remaining}</span>
        </div>
      </Card>

      <Button
        onClick={onContinue}
        disabled={!canContinue}
        size="lg"
        className="mt-6 w-full h-12 text-base"
      >
        Continuar
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </section>
  );
}

function CardsSection({
  deck,
  selectedIds,
  remaining,
  onToggle,
  onContinue,
  loading,
}: {
  deck: TarotCard[];
  selectedIds: string[];
  remaining: number;
  onToggle: (id: string) => void;
  onContinue: () => void;
  loading: boolean;
}) {
  const cardOrder = useMemo(() => deck.map(c => c.id), [deck]);

  return (
    <section className="container max-w-3xl pt-10 pb-12 fade-in">
      <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-foreground text-center">
        Elegí tres cartas
      </h2>
      <p className="mt-3 text-center text-muted-foreground">
        {remaining > 0
          ? `Te quedan ${remaining} ${remaining === 1 ? "carta" : "cartas"} por elegir.`
          : "Tres cartas elegidas. Cuando estés lista."}
      </p>

      <div className="mt-8 grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 justify-items-center">
        {deck.map(card => {
          const isSelected = selectedIds.includes(card.id);
          const order = selectedIds.indexOf(card.id);
          return (
            <div key={card.id} className="relative" style={{ animation: `fadeIn 0.5s ${cardOrder.indexOf(card.id) * 0.04}s both cubic-bezier(0.23, 1, 0.32, 1)` }}>
              <TarotCardView
                back={!isSelected}
                revealed={isSelected}
                name={card.name}
                emoji={card.emoji}
                selected={isSelected}
                size="sm"
                onClick={() => onToggle(card.id)}
              />
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center shadow">
                  {order + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-4 mt-10 z-10">
        <Button
          onClick={onContinue}
          disabled={selectedIds.length !== 3 || loading}
          size="lg"
          className="w-full h-12 text-base shadow-lg"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparando tu lectura</>
          ) : (
            <>Recibir mi lectura<ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </div>
    </section>
  );
}

function LoadingSection() {
  return (
    <section className="container max-w-md pt-32 pb-12 text-center fade-in">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      <h2 className="mt-6 font-serif text-2xl text-foreground">Leyendo tus cartas</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Tomate un respiro. En unos segundos vas a tener tu lectura.
      </p>
    </section>
  );
}
