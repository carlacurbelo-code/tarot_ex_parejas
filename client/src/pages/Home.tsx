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
import {
  isRestrictedQuestion,
  READING_CONTEXT_LABELS,
  RESTRICTED_QUESTION_MESSAGE,
  type ReadingContext,
} from "@shared/readingContext";
import type { CardOrientation, TarotCard, TarotSelection } from "@shared/tarot";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Heart, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Step = "context" | "intro" | "single-cards" | "free-result" | "new-question" | "deep-cards" | "deep-result";
type ContextSelectionMode = "initial" | "new-question";

export default function Home() {
  const [step, setStep] = useState<Step>("context");
  const [readingContext, setReadingContext] = useState<ReadingContext | null>(null);
  const [contextSelectionMode, setContextSelectionMode] = useState<ContextSelectionMode>("initial");
  const [originalQuestion, setOriginalQuestion] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [deepQuestion, setDeepQuestion] = useState("");
  const [singleDeck, setSingleDeck] = useState<TarotCard[]>(() => createIndependentReadingDeck());
  const [deepDeck, setDeepDeck] = useState<TarotCard[]>(() => createIndependentReadingDeck());
  const [singleCard, setSingleCard] = useState<TarotSelection | null>(null);
  const [deepCards, setDeepCards] = useState<TarotSelection[]>([]);
  const [freeReading, setFreeReading] = useState("");
  const [deepReading, setDeepReading] = useState("");
  const [restrictionMessage, setRestrictionMessage] = useState("");
  const submitSingleReading = trpc.tarot.submitSingleCardReading.useMutation();
  const submitDeepReadingMutation = trpc.tarot.submitReading.useMutation();

  const selectReadingContext = (context: ReadingContext) => {
    setReadingContext(context);
    setRestrictionMessage("");
    if (contextSelectionMode === "new-question") {
      setStep("new-question");
      return;
    }
    setOriginalQuestion("");
    setStep("intro");
  };

  const beginSingleDraw = () => {
    if (!readingContext || originalQuestion.trim().length < 10) return;
    if (isRestrictedQuestion(originalQuestion)) {
      setRestrictionMessage(RESTRICTED_QUESTION_MESSAGE);
      return;
    }
    setRestrictionMessage("");
    setSingleCard(null);
    setFreeReading("");
    setSingleDeck(createIndependentReadingDeck());
    setStep("single-cards");
  };

  const toggleSingleCard = (card: TarotCard) => {
    setSingleCard(current => current?.id === card.id ? null : selectSingleCard(card));
  };

  const submitFreeReading = async () => {
    if (!singleCard || !readingContext || originalQuestion.trim().length < 10) return;
    setStep("free-result");
    setFreeReading("");
    try {
      const result = await submitSingleReading.mutateAsync({
        situation: originalQuestion.trim(),
        context: readingContext,
        card: { id: singleCard.id, orientation: singleCard.orientation },
      });
      setFreeReading(result.reading);
    } catch (error) {
      console.error(error);
      setFreeReading("No pude completar la lectura en este momento. Volvé a intentarlo en unos segundos.");
      toast.error("No pudimos generar tu lectura. Probá nuevamente.");
    }
  };

  const beginDeepDraw = (question: string) => {
    const resolved = question.trim();
    if (!readingContext || resolved.length < 10) return;
    if (isRestrictedQuestion(resolved)) {
      setRestrictionMessage(RESTRICTED_QUESTION_MESSAGE);
      return;
    }
    setRestrictionMessage("");
    setDeepQuestion(resolved);
    setDeepCards([]);
    setDeepReading("");
    setDeepDeck(createIndependentReadingDeck());
    setStep("deep-cards");
  };

  const deepenOriginalQuestion = () => {
    beginDeepDraw(resolveDeepQuestion({ originalQuestion, newQuestion, useOriginalQuestion: true }));
  };

  const startAnotherQuestion = () => {
    setNewQuestion("");
    setRestrictionMessage("");
    setContextSelectionMode("new-question");
    setStep("context");
  };

  const submitNewQuestion = () => {
    beginDeepDraw(resolveDeepQuestion({ originalQuestion, newQuestion, useOriginalQuestion: false }));
  };

  const toggleDeepCard = (card: TarotCard) => {
    setDeepCards(current => toggleDeepCards(current, card));
  };

  const handleDeepReading = async () => {
    if (!readingContext || deepCards.length !== 3 || deepQuestion.length < 10) return;
    setStep("deep-result");
    setDeepReading("");
    try {
      const result = await submitDeepReadingMutation.mutateAsync({
        situation: deepQuestion,
        context: readingContext,
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
    <div className="tarot-shell flex min-h-screen flex-col">
      <main className="flex-1">
        {step === "context" && (
          <ContextSelectionSection
            selectedContext={readingContext}
            showBack={contextSelectionMode === "new-question"}
            onBack={() => setStep("free-result")}
            onSelect={selectReadingContext}
          />
        )}
        {step === "intro" && (
          <IntroSection
            question={originalQuestion}
            restrictionMessage={restrictionMessage}
            onQuestionChange={value => {
              setOriginalQuestion(value);
              setRestrictionMessage("");
            }}
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
            actions={
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button size="lg" className="tarot-primary-action h-14 text-base font-semibold" onClick={deepenOriginalQuestion}>
                  Profundizar esta lectura <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="tarot-secondary-action h-14 text-base" onClick={startAnotherQuestion}>
                  Hacer otra pregunta
                </Button>
              </div>
            }
          />
        )}
        {step === "new-question" && (
          <NewQuestionSection
            question={newQuestion}
            restrictionMessage={restrictionMessage}
            onQuestionChange={value => {
              setNewQuestion(value);
              setRestrictionMessage("");
            }}
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

function ContextSelectionSection({
  selectedContext,
  showBack,
  onBack,
  onSelect,
}: {
  selectedContext: ReadingContext | null;
  showBack: boolean;
  onBack: () => void;
  onSelect: (context: ReadingContext) => void;
}) {
  return (
    <section className="tarot-page max-w-3xl py-10 sm:py-20 fade-in">
      {showBack && (
        <Button variant="ghost" onClick={onBack} className="mb-7 -ml-2 text-muted-foreground hover:bg-transparent hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a tu lectura
        </Button>
      )}
      <div className="tarot-surface relative overflow-hidden px-5 py-10 text-center sm:px-12 sm:py-14">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--tarot-accent)]/80 to-transparent" />
        <p className="tarot-kicker flex items-center justify-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Tarot de Medianoche</p>
        <h1 className="mt-4 font-serif text-4xl leading-[0.95] text-foreground sm:text-6xl">Elegí el tema<br className="hidden sm:block" /> de tu consulta</h1>
        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {(["love", "money_work"] as const).map(context => {
            const isLove = context === "love";
            const Icon = isLove ? Heart : BriefcaseBusiness;
            return (
              <button
                key={context}
                type="button"
                aria-pressed={selectedContext === context}
                className="group relative min-h-40 overflow-hidden rounded-[var(--tarot-radius-md)] border border-[var(--tarot-border)] bg-[linear-gradient(145deg,oklch(0.29_0.05_314_/_80%),oklch(0.215_0.038_309_/_92%))] p-5 text-left shadow-[var(--tarot-shadow)] transition duration-200 hover:-translate-y-1 hover:border-[var(--tarot-accent)]/80 hover:shadow-[var(--tarot-shadow-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onSelect(context)}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--tarot-border)] bg-[var(--tarot-surface-elevated)] text-[var(--tarot-accent-hover)] transition group-hover:scale-105">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="mt-8 block font-serif text-2xl leading-none text-foreground">{READING_CONTEXT_LABELS[context]}</span>
                <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-[var(--tarot-accent-hover)] transition-transform group-hover:translate-x-1" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function IntroSection({
  question,
  restrictionMessage,
  onQuestionChange,
  onStart,
}: {
  question: string;
  restrictionMessage: string;
  onQuestionChange: (value: string) => void;
  onStart: () => void;
}) {
  const canStart = question.trim().length >= 10;
  return (
    <section className="tarot-page max-w-2xl py-10 sm:py-20 fade-in">
      <div className="tarot-surface px-5 py-10 sm:px-10 sm:py-14">
        <p className="tarot-kicker text-center">Tarot de Medianoche</p>
        <h1 className="mt-4 text-center font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">Haceme tu pregunta</h1>
        <p className="mx-auto mt-5 max-w-lg text-center text-base leading-relaxed text-muted-foreground sm:text-lg">Escribí lo que querés saber y elegí una carta.</p>
        <label htmlFor="question" className="sr-only">Tu pregunta</label>
        <textarea
          id="question"
          value={question}
          onChange={event => onQuestionChange(event.target.value)}
          maxLength={500}
          rows={4}
          placeholder="¿Qué querés preguntarle al tarot?"
          className="mt-8 w-full resize-none rounded-[var(--tarot-radius-sm)] border border-[var(--tarot-border)] bg-[oklch(0.17_0.032_307_/_78%)] px-4 py-4 text-left text-foreground shadow-inner outline-none transition placeholder:text-muted-foreground/70 focus:border-[var(--tarot-accent)] focus:ring-2 focus:ring-[var(--tarot-accent)]/25"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Una pregunta concreta ayuda a enfocar la lectura.</span>
          <span>{question.length}/500</span>
        </div>
        {restrictionMessage && <p role="alert" className="tarot-surface-elevated mt-5 px-4 py-3 text-left text-sm leading-relaxed text-destructive">{restrictionMessage}</p>}
        <div className="mt-8 text-center">
          <Button onClick={onStart} disabled={!canStart} size="lg" className="tarot-primary-action h-14 px-8 text-base font-semibold">
            Elegir una carta <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">Lectura inicial gratuita · sin registro</p>
        </div>
      </div>
      <div className="mx-auto mt-10 grid max-w-xs grid-cols-3 gap-3 sm:gap-5">
        {["☾", "♡", "✦"].map((symbol, index) => (
          <div
            key={symbol}
            className="flex aspect-[2/3] items-center justify-center rounded-[var(--tarot-radius-sm)] border border-[var(--tarot-border)] bg-[linear-gradient(145deg,var(--tarot-surface-elevated),var(--tarot-night))] text-3xl text-[var(--tarot-accent-hover)]/75 shadow-[var(--tarot-shadow)]"
            style={{ animation: `fadeIn 0.32s ${index * 0.08}s both cubic-bezier(0.23, 1, 0.32, 1)` }}
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
    <section className="tarot-page max-w-5xl py-7 pb-24 fade-in">
      <Button variant="ghost" onClick={onBack} className="mb-7 -ml-2 text-muted-foreground hover:bg-transparent hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la pregunta
      </Button>
      <div className="text-center">
        <p className="tarot-kicker">Tarot de Medianoche</p>
        <h2 className="mt-3 font-serif text-4xl leading-tight text-foreground sm:text-5xl">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">{selectionText}</p>
      </div>
      <div className="tarot-surface mt-8 grid grid-cols-4 justify-items-center gap-3 p-3 sm:grid-cols-6 sm:gap-4 sm:p-6">
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
                <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-[0_4px_12px_var(--tarot-accent-glow)]">
                  {order + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="sticky bottom-4 z-10 mt-8 rounded-[var(--tarot-radius-sm)] bg-[var(--tarot-void)]/88 p-2 backdrop-blur-lg">
        <Button onClick={onContinue} disabled={selectedCards.length !== requiredCount} size="lg" className="tarot-primary-action h-14 w-full text-base font-semibold">
          {continueLabel} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function NewQuestionSection({
  question,
  restrictionMessage,
  onQuestionChange,
  onBack,
  onContinue,
}: {
  question: string;
  restrictionMessage: string;
  onQuestionChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const canContinue = question.trim().length >= 10;
  return (
    <section className="tarot-page max-w-2xl py-8 pb-16 fade-in">
      <Button variant="ghost" onClick={onBack} className="mb-7 -ml-2 text-muted-foreground hover:bg-transparent hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a tu lectura
      </Button>
      <div className="tarot-surface px-5 py-9 sm:px-10">
        <h1 className="text-center font-serif text-4xl leading-tight text-foreground sm:text-5xl">Haceme tu pregunta</h1>
        <p className="mt-4 text-center text-muted-foreground">Escribí lo que querés saber y elegí una carta.</p>
        <textarea
          id="new-question"
          value={question}
          onChange={event => onQuestionChange(event.target.value)}
          maxLength={500}
          rows={4}
          placeholder="¿Qué querés preguntarle al tarot?"
          className="mt-8 w-full resize-none rounded-[var(--tarot-radius-sm)] border border-[var(--tarot-border)] bg-[oklch(0.17_0.032_307_/_78%)] px-4 py-4 text-left text-foreground shadow-inner outline-none transition placeholder:text-muted-foreground/70 focus:border-[var(--tarot-accent)] focus:ring-2 focus:ring-[var(--tarot-accent)]/25"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Una pregunta concreta ayuda a enfocar la lectura.</span>
          <span>{question.length}/500</span>
        </div>
        {restrictionMessage && <p role="alert" className="tarot-surface-elevated mt-5 px-4 py-3 text-sm leading-relaxed text-destructive">{restrictionMessage}</p>}
        <Button onClick={onContinue} disabled={!canContinue} size="lg" className="tarot-primary-action mt-8 h-14 w-full text-base font-semibold">
          Elegir tres cartas <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
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
  actions,
}: {
  cards: TarotSelection[];
  reading: string;
  loading: boolean;
  eyebrow: string;
  title: string;
  onBack: () => void;
  actions?: React.ReactNode;
}) {
  const loadingMessage = cards.length === 1
    ? "Interpretando tu carta…"
    : "Interpretando la combinación de tus cartas…";

  return (
    <section className="tarot-page max-w-3xl py-8 pb-16 fade-in">
      <Button variant="ghost" onClick={onBack} className="mb-7 -ml-2 text-muted-foreground hover:bg-transparent hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a las cartas
      </Button>
      <div className="text-center">
        <p className="tarot-kicker">{eyebrow}</p>
        <h1 className="mt-2 text-center font-serif text-3xl leading-[1.05] text-foreground sm:text-4xl">{title}</h1>
      </div>
      <div className={`mt-5 flex justify-center ${cards.length === 1 ? "gap-0" : "gap-3 sm:gap-5"}`}>
        {cards.map(card => (
          <TarotCardView
            key={card.id}
            name={card.name}
            emoji={card.emoji}
            revealed
            orientation={card.orientation}
            size={cards.length === 1 ? "lg" : "md"}
          />
        ))}
      </div>
      <Card className="tarot-reading-surface mt-7 min-h-0 gap-0 border-0 p-5 shadow-none sm:p-7">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center text-muted-foreground">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--tarot-border)] bg-[var(--tarot-surface-elevated)] shadow-[0_0_22px_var(--tarot-accent-glow)]">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--tarot-accent-hover)]" />
            </span>
            <span className="font-serif text-lg text-foreground">{loadingMessage}</span>
          </div>
        ) : (
          <div className="font-serif text-base leading-[1.65] text-foreground whitespace-pre-line sm:text-lg">{reading}</div>
        )}
      </Card>
      {!loading && actions}
    </section>
  );
}

export type { CardOrientation };
