import { TarotCardView } from "@/components/TarotCardView";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteFooter } from "@/components/SiteFooter";
import { trpc } from "@/lib/trpc";
import {
  createIndependentReadingDeck,
  resolveDeepQuestion,
  selectSingleCard,
  toggleDeepCards,
} from "@shared/readingFlow";
import type { CardOrientation, TarotCard, TarotSelection } from "@shared/tarot";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Step = "intro" | "single-cards" | "free-result" | "new-question" | "deep-cards" | "deep-result";

export default function Home() {
  const [step, setStep] = useState<Step>("intro");
  const [originalQuestion, setOriginalQuestion] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [deepQuestion, setDeepQuestion] = useState("");
  const [singleDeck, setSingleDeck] = useState<TarotCard[]>(() => createIndependentReadingDeck());
  const [deepDeck, setDeepDeck] = useState<TarotCard[]>(() => createIndependentReadingDeck());
  const [singleCard, setSingleCard] = useState<TarotSelection | null>(null);
  const [deepCards, setDeepCards] = useState<TarotSelection[]>([]);
  const [freeReading, setFreeReading] = useState("");
  const [deepeningHook, setDeepeningHook] = useState("");
  const [deepReading, setDeepReading] = useState("");
  const submitSingleReading = trpc.tarot.submitSingleCardReading.useMutation();
  const submitDeepReadingMutation = trpc.tarot.submitReading.useMutation();

  const beginSingleDraw = () => {
    setSingleCard(null);
    setFreeReading("");
    setDeepeningHook("");
    setSingleDeck(createIndependentReadingDeck());
    setStep("single-cards");
  };

  const toggleSingleCard = (card: TarotCard) => {
    setSingleCard(current => current?.id === card.id ? null : selectSingleCard(card));
  };

  const submitFreeReading = async () => {
    if (!singleCard || originalQuestion.trim().length < 10) return;
    setStep("free-result");
    setFreeReading("");
    setDeepeningHook("");
    try {
      const result = await submitSingleReading.mutateAsync({
        situation: originalQuestion.trim(),
        card: { id: singleCard.id, orientation: singleCard.orientation },
      });
      setFreeReading(result.reading);
      setDeepeningHook(result.deepening_hook);
    } catch (error) {
      console.error(error);
      setFreeReading("No pude completar la lectura en este momento. Volvé a intentarlo en unos segundos.");
      toast.error("No pudimos generar tu lectura. Probá nuevamente.");
    }
  };

  const beginDeepDraw = (question: string) => {
    const resolved = question.trim();
    if (resolved.length < 10) return;
    setDeepQuestion(resolved);
    setDeepCards([]);
    setDeepReading("");
    setDeepDeck(createIndependentReadingDeck());
    setStep("deep-cards");
  };

  const deepenOriginalQuestion = () => {
    beginDeepDraw(resolveDeepQuestion({
      originalQuestion,
      newQuestion,
      useOriginalQuestion: true,
    }));
  };

  const startAnotherQuestion = () => {
    setNewQuestion("");
    setStep("new-question");
  };

  const submitNewQuestion = () => {
    beginDeepDraw(resolveDeepQuestion({
      originalQuestion,
      newQuestion,
      useOriginalQuestion: false,
    }));
  };

  const toggleDeepCard = (card: TarotCard) => {
    setDeepCards(current => toggleDeepCards(current, card));
  };

  const handleDeepReading = async () => {
    if (deepCards.length !== 3 || deepQuestion.length < 10) return;
    setStep("deep-result");
    setDeepReading("");
    try {
      const result = await submitDeepReadingMutation.mutateAsync({
        situation: deepQuestion,
        cards: deepCards.map(({ id, orientation }) => ({ id, orientation })),
      });
      setDeepReading(result.reading);
    } catch (error) {
      console.error(error);
      setDeepReading("No pude completar la lectura en este momento. Volvé a intentarlo en unos segundos.");
      toast.error("No pudimos generar tu lectura. Probá nuevamente.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {step === "intro" && (
          <IntroSection
            question={originalQuestion}
            onQuestionChange={setOriginalQuestion}
            onStart={beginSingleDraw}
          />
        )}
        {step === "single-cards" && (
          <CardSelectionSection
            deck={singleDeck}
            selectedCards={singleCard ? [singleCard] : []}
            requiredCount={1}
            title="Elegí una carta"
            continueLabel="Ver mi lectura"
            onToggle={toggleSingleCard}
            onBack={() => setStep("intro")}
            onContinue={submitFreeReading}
          />
        )}
        {step === "free-result" && singleCard && (
          <ReadingResultSection
            cards={[singleCard]}
            reading={freeReading}
            loading={submitSingleReading.isPending}
            eyebrow="Tu lectura"
            title="Lo que dice tu carta"
            onBack={() => setStep("single-cards")}
            deepeningHook={deepeningHook}
            actions={
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button size="lg" className="h-12 text-base" onClick={deepenOriginalQuestion}>
                  Profundizar esta lectura <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="h-12 text-base" onClick={startAnotherQuestion}>
                  Hacer otra pregunta
                </Button>
              </div>
            }
          />
        )}
        {step === "new-question" && (
          <NewQuestionSection
            question={newQuestion}
            onQuestionChange={setNewQuestion}
            onBack={() => setStep("free-result")}
            onContinue={submitNewQuestion}
          />
        )}
        {step === "deep-cards" && (
          <CardSelectionSection
            deck={deepDeck}
            selectedCards={deepCards}
            requiredCount={3}
            title="Elegí tres cartas"
            continueLabel="Ver mi lectura profunda"
            onToggle={toggleDeepCard}
            onBack={() => setStep("free-result")}
            onContinue={handleDeepReading}
          />
        )}
        {step === "deep-result" && (
          <ReadingResultSection
            cards={deepCards}
            reading={deepReading}
            loading={submitDeepReadingMutation.isPending}
            eyebrow="Tu lectura profunda"
            title="Lo que dicen tus cartas"
            onBack={() => setStep("deep-cards")}
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function IntroSection({
  question,
  onQuestionChange,
  onStart,
}: {
  question: string;
  onQuestionChange: (value: string) => void;
  onStart: () => void;
}) {
  const canStart = question.trim().length >= 10;
  return (
    <section className="container max-w-2xl pt-12 pb-12 sm:pt-20 fade-in">
      <div className="text-center">
        <p className="font-serif italic text-muted-foreground text-base sm:text-lg">Lecturas íntimas</p>
        <h1 className="mt-6 font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.1] tracking-tight text-foreground">
          ¿Tu ex todavía
          <br />
          <span className="italic text-primary">siente algo?</span>
        </h1>
        <p className="mt-7 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
          Escribí lo que querés entender sobre ese vínculo y elegí una carta.
        </p>
        <label htmlFor="question" className="sr-only">Tu pregunta</label>
        <textarea
          id="question"
          value={question}
          onChange={event => onQuestionChange(event.target.value)}
          maxLength={500}
          rows={4}
          placeholder="¿Qué querés preguntarle al tarot sobre esta relación?"
          className="mt-8 w-full rounded-lg border border-border/70 bg-card/70 px-4 py-3 text-left text-foreground placeholder:text-muted-foreground/70 shadow-sm outline-none transition focus:ring-2 focus:ring-primary/40 resize-none"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Una pregunta concreta ayuda a enfocar la lectura.</span>
          <span>{question.length}/500</span>
        </div>
        <div className="mt-8">
          <Button onClick={onStart} disabled={!canStart} size="lg" className="h-12 px-8 text-base font-medium">
            Elegir una carta
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">Lectura inicial gratuita · sin registro</p>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-6 max-w-md mx-auto">
        {["☾", "♡", "✦"].map((symbol, index) => (
          <div
            key={symbol}
            className="aspect-[2/3] rounded-lg bg-gradient-to-br from-[oklch(0.42_0.04_240)] to-[oklch(0.32_0.035_245)] flex items-center justify-center text-3xl text-[oklch(0.78_0.045_55)]/70 shadow-sm"
            style={{ animation: `fadeIn 0.8s ${index * 0.15}s both cubic-bezier(0.23, 1, 0.32, 1)` }}
          >
            {symbol}
          </div>
        ))}
      </div>
    </section>
  );
}

function CardSelectionSection({
  deck,
  selectedCards,
  requiredCount,
  title,
  continueLabel,
  onToggle,
  onBack,
  onContinue,
}: {
  deck: TarotCard[];
  selectedCards: TarotSelection[];
  requiredCount: number;
  title: string;
  continueLabel: string;
  onToggle: (card: TarotCard) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const selectedIds = selectedCards.map(card => card.id);
  const remaining = requiredCount - selectedCards.length;
  const selectionText = remaining > 0
    ? `Te queda${remaining === 1 ? "" : "n"} ${remaining} ${remaining === 1 ? "carta" : "cartas"} por elegir.`
    : `${requiredCount === 1 ? "Carta elegida." : "Tres cartas elegidas."}`;

  return (
    <section className="container max-w-3xl pt-8 pb-24 fade-in">
      <Button variant="ghost" onClick={onBack} className="mb-5 -ml-2 text-muted-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la pregunta
      </Button>
      <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-foreground text-center">{title}</h2>
      <p className="mt-3 text-center text-muted-foreground">{selectionText}</p>

      <div className="mt-8 grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 justify-items-center">
        {deck.map(card => {
          const selected = selectedCards.find(item => item.id === card.id);
          const order = selectedIds.indexOf(card.id);
          return (
            <div key={card.id} className="relative">
              <TarotCardView
                back={!selected}
                revealed={Boolean(selected)}
                name={card.name}
                emoji={card.emoji}
                selected={Boolean(selected)}
                orientation={selected?.orientation}
                size="sm"
                onClick={() => onToggle(card)}
              />
              {selected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center shadow">
                  {order + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-4 mt-10 z-10">
        <Button onClick={onContinue} disabled={selectedCards.length !== requiredCount} size="lg" className="w-full h-12 text-base shadow-lg">
          {continueLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function NewQuestionSection({
  question,
  onQuestionChange,
  onBack,
  onContinue,
}: {
  question: string;
  onQuestionChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const canContinue = question.trim().length >= 10;
  return (
    <section className="container max-w-2xl pt-8 pb-16 fade-in">
      <Button variant="ghost" onClick={onBack} className="mb-5 -ml-2 text-muted-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a tu lectura
      </Button>
      <h1 className="font-serif text-3xl sm:text-4xl text-center text-foreground leading-tight">¿Qué querés preguntar?</h1>
      <textarea
        id="new-question"
        value={question}
        onChange={event => onQuestionChange(event.target.value)}
        maxLength={500}
        rows={4}
        placeholder="Escribí tu nueva pregunta sobre este vínculo"
        className="mt-8 w-full rounded-lg border border-border/70 bg-card/70 px-4 py-3 text-left text-foreground placeholder:text-muted-foreground/70 shadow-sm outline-none transition focus:ring-2 focus:ring-primary/40 resize-none"
      />
      <div className="mt-2 flex justify-end text-xs text-muted-foreground"><span>{question.length}/500</span></div>
      <Button onClick={onContinue} disabled={!canContinue} size="lg" className="mt-8 w-full h-12 text-base">
        Elegir tres cartas <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </section>
  );
}

function ReadingResultSection({
  cards,
  reading,
  loading,
  eyebrow,
  title,
  onBack,
  deepeningHook,
  actions,
}: {
  cards: TarotSelection[];
  reading: string;
  loading: boolean;
  eyebrow: string;
  title: string;
  onBack: () => void;
  deepeningHook?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="container max-w-2xl pt-8 pb-16 fade-in">
      <Button variant="ghost" onClick={onBack} className="mb-5 -ml-2 text-muted-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a las cartas
      </Button>
      <p className="text-center font-serif italic text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-center text-foreground leading-tight">{title}</h1>

      <div className="mt-8 flex justify-center gap-3 sm:gap-4">
        {cards.map(card => (
          <TarotCardView
            key={card.id}
            name={card.name}
            emoji={card.emoji}
            revealed
            orientation={card.orientation}
            size="sm"
          />
        ))}
      </div>

      <Card className="mt-10 p-6 sm:p-8 bg-card border-border/60 shadow-sm min-h-44">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Estoy leyendo la combinación de tus cartas…
          </div>
        ) : (
          <div className="font-serif text-base sm:text-lg leading-[1.85] text-foreground whitespace-pre-line">{reading}</div>
        )}
      </Card>

      {deepeningHook && !loading && (
        <Card className="mt-6 p-5 sm:p-6 bg-secondary/35 border-border/60 shadow-sm">
          <p className="text-sm leading-relaxed text-foreground">{deepeningHook}</p>
          {actions}
        </Card>
      )}
    </section>
  );
}

export type { CardOrientation };
