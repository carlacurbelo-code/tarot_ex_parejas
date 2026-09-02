import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteFooter } from "@/components/SiteFooter";
import { trpc } from "@/lib/trpc";
import { createIndependentReadingDeck, toggleDeepCards } from "@shared/readingFlow";
import { isRestrictedQuestion, READING_CONTEXT_LABELS, RESTRICTED_QUESTION_MESSAGE, type ReadingContext } from "@shared/readingContext";
import { getTarotImageUrl, normalizeSelection, type TarotCard, type TarotSelection } from "@shared/tarot";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, Heart, Loader2, Mail, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { TarotCardView } from "@/components/TarotCardView";

type Step = "context" | "intro" | "free-cards" | "free-result" | "paid-question" | "paid-cards" | "paid-result" | "paywall" | "checkout";

export default function Home() {
  const [location] = useLocation();
  const [step, setStep] = useState<Step>("context");
  const [context, setContext] = useState<ReadingContext | null>(null);
  const [question, setQuestion] = useState("");
  const [paidQuestion, setPaidQuestion] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [freeDeck, setFreeDeck] = useState<TarotCard[]>([]);
  const [paidDeck, setPaidDeck] = useState<TarotCard[]>([]);
  const [freeCards, setFreeCards] = useState<TarotSelection[]>([]);
  const [paidCards, setPaidCards] = useState<TarotSelection[]>([]);
  const [paidReadingToken, setPaidReadingToken] = useState("");
  const [freeReading, setFreeReading] = useState("");
  const [paidReading, setPaidReading] = useState("");
  const [credits, setCredits] = useState(0);
  const [packToken, setPackToken] = useState("");
  const [restrictionMessage, setRestrictionMessage] = useState("");
  const packReturn = new URLSearchParams(location.split("?")[1] ?? "").get("tarot_pack") ?? "";
  const createFree = trpc.dodo.createFreeReading.useMutation();
  const submitCredit = trpc.dodo.submitCreditReading.useMutation();
  const createPack = trpc.dodo.createCreditPackCheckout.useMutation();
  const freeAccess = trpc.dodo.getFreeAccessStatus.useQuery();
  const packStatus = trpc.dodo.getCreditPackStatus.useQuery({ packToken: packReturn || "pending-pack-token" }, { enabled: Boolean(packReturn), refetchInterval: query => query.state.data?.status === "checkout_created" ? 2000 : false });
  const product = trpc.dodo.getCreditPackProduct.useQuery();

  useEffect(() => {
    const returned = packStatus.data;
    if (!returned) return;
    setCredits(returned.credits);
    setPackToken(packReturn);
    if (returned.status === "paid") {
      setPaidQuestion("");
      setPaidCards([]);
      setPaidDeck([]);
      setStep("paid-question");
    } else {
      setStep("checkout");
    }
  }, [packStatus.data, packReturn]);

  useEffect(() => {
    if (!freeAccess.data) return;
    setCredits(freeAccess.data.credits);
    if (!freeAccess.data.freeAvailable && freeAccess.data.credits === 0) setStep("paywall");
  }, [freeAccess.data]);

  const chooseContext = (next: ReadingContext) => {
    setContext(next);
    setRestrictionMessage("");
    setQuestion("");
    if (freeAccess.data && !freeAccess.data.freeAvailable && freeAccess.data.credits > 0) setStep("paid-question");
    else if (freeAccess.data && !freeAccess.data.freeAvailable) setStep("paywall");
    else setStep("intro");
  };

  const beginFreeDraw = () => {
    if (!context || question.trim().length < 10) return;
    if (isRestrictedQuestion(question)) { setRestrictionMessage(RESTRICTED_QUESTION_MESSAGE); return; }
    setRestrictionMessage("");
    setFreeCards([]);
    setFreeDeck(createIndependentDeck());
    setStep("free-cards");
  };

  const toggleFreeCard = (card: TarotCard) => setFreeCards(current => toggleDeepCards(current, card));
  const togglePaidCard = (card: TarotCard) => setPaidCards(current => toggleDeepCards(current, card));

  const submitFreeCards = async () => {
    if (!context || freeCards.length !== 3) return;
    try {
      const result = await createFree.mutateAsync({ situation: question.trim(), context, cards: freeCards.map(({ id, orientation }) => ({ id, orientation })) });
      setFreeCards(normalizeSelection(result.cards));
      setFreeReading(result.reading);
      setCredits(result.credits);
      setStep("free-result");
    } catch (error: any) {
      if (error?.data?.code === "FORBIDDEN") setStep("paywall");
      toast.error(error?.message ?? "No pudimos completar tu lectura.");
    }
  };

  const startPaid = () => {
    if (credits > 0) { setPaidQuestion(""); setPaidReadingToken(""); setStep("paid-question"); } else setStep("paywall");
  };

  const beginPaidDraw = () => {
    if (paidQuestion.trim().length < 10 || !context) return;
    if (isRestrictedQuestion(paidQuestion)) { setRestrictionMessage(RESTRICTED_QUESTION_MESSAGE); return; }
    setRestrictionMessage("");
    setPaidCards([]);
    setPaidReadingToken(window.crypto.randomUUID().replaceAll("-", ""));
    setPaidDeck(createIndependentDeck());
    setStep("paid-cards");
  };

  const submitPaid = async () => {
    if (!context || paidCards.length !== 3) return;
    try {
      if (!paidReadingToken) throw new Error("No pudimos preparar la lectura. Volvé a elegir las cartas.");
      const result = await submitCredit.mutateAsync({ readingToken: paidReadingToken, question: paidQuestion.trim(), context, cards: paidCards.map(({ id, orientation }) => ({ id, orientation })) });
      setPaidReading(result.reading);
      setCredits(result.credits);
      setPaidCards(normalizeSelection(result.cards));
      setStep("paid-result");
    } catch (error: any) { toast.error(error?.message ?? "No pudimos generar la lectura. Tu crédito fue restaurado si correspondía."); }
  };

  const buyPack = async () => {
    if (!/^\S+@\S+\.\S+$/.test(checkoutEmail.trim()) || !product.data?.configured) return;
    try {
      const result = await createPack.mutateAsync({ email: checkoutEmail.trim(), marketingConsent, origin: window.location.origin });
      setPackToken(result.packToken);
      window.location.assign(result.checkoutUrl);
    } catch (error: any) { toast.error(error?.message ?? "No pudimos iniciar el pago."); }
  };

  return <div className="tarot-shell flex min-h-screen flex-col"><main className="flex-1">
    {step === "context" && <ContextSection selected={context} onSelect={chooseContext} />}
    {step === "intro" && <QuestionSection title="Haceme tu pregunta" question={question} restriction={restrictionMessage} onChange={value => { setQuestion(value); setRestrictionMessage(""); }} onBack={() => setStep("context")} onContinue={beginFreeDraw} continueLabel="Elegir 3 cartas" />}
    {step === "free-cards" && <SelectionSection deck={freeDeck} selected={freeCards} title="Elegí 3 cartas" onToggle={toggleFreeCard} onBack={() => setStep("intro")} onContinue={submitFreeCards} loading={createFree.isPending} continueLabel={createFree.isPending ? "Interpretando…" : "Ver mi lectura"} />}
    {step === "free-result" && <ResultSection cards={freeCards} reading={freeReading} loading={createFree.isPending} title="Lo que dicen tus cartas" eyebrow="Tu lectura" actions={<Upsell credits={credits} product={product.data} loading={createPack.isPending} onBuy={() => setStep("paywall")} onNew={startPaid} />} />}
    {step === "paid-question" && <QuestionSection title="Una nueva pregunta" question={paidQuestion} restriction={restrictionMessage} onChange={value => { setPaidQuestion(value); setRestrictionMessage(""); }} onBack={() => setStep("free-result")} onContinue={beginPaidDraw} continueLabel="Elegir 3 cartas" creditLabel={`${credits} ${credits === 1 ? "crédito disponible" : "créditos disponibles"}`} />}
    {step === "paid-cards" && <SelectionSection deck={paidDeck} selected={paidCards} title="Elegí 3 cartas" onToggle={togglePaidCard} onBack={() => setStep("paid-question")} onContinue={submitPaid} loading={submitCredit.isPending} continueLabel={submitCredit.isPending ? "Interpretando…" : "Ver mi lectura"} />}
    {step === "paid-result" && <ResultSection cards={paidCards} reading={paidReading} loading={submitCredit.isPending} title="Lo que dicen tus cartas" eyebrow={`${credits} ${credits === 1 ? "crédito restante" : "créditos restantes"}`} actions={<div className="mt-7 grid gap-3 sm:grid-cols-2"><Button size="lg" className="tarot-primary-action h-14 text-base font-semibold" onClick={startPaid}>Hacer otra lectura <ArrowRight className="ml-2 h-4 w-4" /></Button><Button variant="outline" size="lg" className="tarot-secondary-action h-14 text-base" onClick={() => setStep("paywall")}>Comprar otro pack</Button></div>} />}
    {step === "paywall" && <Paywall credits={credits} product={product.data} email={checkoutEmail} consent={marketingConsent} loading={createPack.isPending} onEmail={setCheckoutEmail} onConsent={setMarketingConsent} onBack={() => setStep(freeReading ? "free-result" : "context")} onBuy={buyPack} />}
    {step === "checkout" && <CheckoutStatus status={packStatus.data?.status} loading={packStatus.isLoading || packStatus.isFetching} onBack={() => setStep("paywall")} />}
  </main><SiteFooter /></div>;
}

function createIndependentDeck(): TarotCard[] { return createIndependentReadingDeck(); }

function ContextSection({ selected, onSelect }: { selected: ReadingContext | null; onSelect: (context: ReadingContext) => void }) {
  return <section className="tarot-page max-w-3xl py-10 sm:py-20 fade-in"><div className="tarot-surface relative overflow-hidden px-5 py-10 text-center sm:px-12 sm:py-14"><p className="tarot-kicker flex items-center justify-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Tarot de Medianoche</p><h1 className="mt-4 font-serif text-4xl leading-[0.95] text-foreground sm:text-6xl">Elegí el tema<br className="hidden sm:block" /> de tu consulta</h1><div className="mt-9 grid gap-4 sm:grid-cols-2">{(["love", "money_work"] as const).map(value => { const love = value === "love"; const Icon = love ? Heart : BriefcaseBusiness; return <button key={value} type="button" aria-pressed={selected === value} onClick={() => onSelect(value)} className="group relative min-h-40 rounded-[var(--tarot-radius-md)] border border-[var(--tarot-border)] bg-[linear-gradient(145deg,oklch(0.29_0.05_314_/_80%),oklch(0.215_0.038_309_/_92%))] p-5 text-left shadow-[var(--tarot-shadow)] transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--tarot-border)] bg-[var(--tarot-surface-elevated)] text-[var(--tarot-accent-hover)]"><Icon className="h-4 w-4" /></span><span className="mt-8 block font-serif text-2xl text-foreground">{READING_CONTEXT_LABELS[value]}</span><ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-[var(--tarot-accent-hover)]" /></button>; })}</div></div></section>;
}

function QuestionSection({ title, question, restriction, creditLabel, onChange, onBack, onContinue, continueLabel }: { title: string; question: string; restriction: string; creditLabel?: string; onChange: (value: string) => void; onBack: () => void; onContinue: () => void; continueLabel: string }) {
  return <section className="tarot-page max-w-2xl py-10 sm:py-20 fade-in"><Button variant="ghost" onClick={onBack} className="mb-7 -ml-2 text-muted-foreground hover:bg-transparent hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button><div className="tarot-surface px-5 py-10 sm:px-10 sm:py-14"><p className="tarot-kicker text-center">Tarot de Medianoche</p><h1 className="mt-4 text-center font-serif text-4xl leading-tight text-foreground sm:text-5xl">{title}</h1><p className="mx-auto mt-5 max-w-lg text-center text-base leading-relaxed text-muted-foreground">Escribí lo que querés saber y dejá que la tirada abra una perspectiva.</p><textarea value={question} onChange={event => onChange(event.target.value)} maxLength={800} rows={5} placeholder="¿Qué querés preguntarle al tarot?" className="mt-8 w-full resize-none rounded-[var(--tarot-radius-sm)] border border-[var(--tarot-border)] bg-[oklch(0.17_0.032_307_/_78%)] px-4 py-4 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-[var(--tarot-accent)] focus:ring-2 focus:ring-[var(--tarot-accent)]/25" /><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Una pregunta concreta ayuda a enfocar la lectura.</span><span>{question.length}/800</span></div>{restriction && <p role="alert" className="tarot-surface-elevated mt-5 px-4 py-3 text-left text-sm leading-relaxed text-destructive">{restriction}</p>}<Button onClick={onContinue} disabled={question.trim().length < 10} size="lg" className="tarot-primary-action mt-8 h-14 w-full text-base font-semibold">{continueLabel}<ArrowRight className="ml-2 h-4 w-4" /></Button>{creditLabel && <p className="mt-4 text-center text-xs text-muted-foreground">{creditLabel}</p>}</div></section>;
}

function SelectionSection({ deck, selected, title, onToggle, onBack, onContinue, continueLabel, loading = false }: { deck: TarotCard[]; selected: TarotSelection[]; title: string; onToggle: (card: TarotCard) => void; onBack: () => void; onContinue: () => void; continueLabel: string; loading?: boolean }) {
  const ids = selected.map(card => card.id); const remaining = 3 - selected.length;
  return <section className="tarot-page max-w-5xl py-7 pb-24 fade-in"><Button variant="ghost" onClick={onBack} disabled={loading} className="mb-7 -ml-2 text-muted-foreground hover:bg-transparent hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button><div className="text-center"><p className="tarot-kicker">Tarot de Medianoche</p><h2 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">{title}</h2><p className="mt-3 text-sm text-muted-foreground">{remaining ? `Te quedan ${remaining} ${remaining === 1 ? "carta" : "cartas"} por elegir.` : "Tres cartas elegidas."}</p></div><div className="tarot-surface mt-8 grid grid-cols-4 justify-items-center gap-3 p-3 sm:grid-cols-6 sm:gap-4 sm:p-6">{deck.map(card => { const chosen = selected.find(item => item.id === card.id); const order = ids.indexOf(card.id); return <div key={card.id} className="relative"><TarotCardView back={!chosen} revealed={Boolean(chosen)} name={card.name} emoji={card.emoji} imageSrc={getTarotImageUrl(card.id)} selected={Boolean(chosen)} orientation={chosen?.orientation} size="sm" onClick={() => !loading && onToggle(card)} />{chosen && <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{order + 1}</span>}</div>; })}</div><div className="sticky bottom-4 z-10 mt-8 rounded-[var(--tarot-radius-sm)] bg-[var(--tarot-void)]/88 p-2 backdrop-blur-lg"><Button onClick={onContinue} disabled={selected.length !== 3 || loading} size="lg" className="tarot-primary-action h-14 w-full text-base font-semibold">{continueLabel}<ArrowRight className="ml-2 h-4 w-4" /></Button></div></section>;
}

function ResultSection({ cards, reading, loading, eyebrow, title, actions }: { cards: TarotSelection[]; reading: string; loading: boolean; eyebrow: string; title: string; actions?: React.ReactNode }) {
  return <section className="tarot-page max-w-3xl py-8 pb-16 fade-in"><div className="text-center"><p className="tarot-kicker">{eyebrow}</p><h1 className="mt-2 font-serif text-3xl leading-tight text-foreground sm:text-4xl">{title}</h1></div><div className="mt-5 flex justify-center gap-3 sm:gap-5">{cards.map(card => <TarotCardView key={card.id} name={card.name} emoji={card.emoji} imageSrc={getTarotImageUrl(card.id)} revealed orientation={card.orientation} size="md" />)}</div><Card className="tarot-reading-surface mt-7 border-0 p-5 shadow-none sm:p-7">{loading ? <div className="flex flex-col items-center gap-4 py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-[var(--tarot-accent-hover)]" /><span className="font-serif text-lg text-foreground">Interpretando la combinación de tus cartas…</span></div> : <div className="whitespace-pre-line font-serif text-base leading-[1.65] text-foreground sm:text-lg">{reading}</div>}</Card>{!loading && actions}</section>;
}

function Upsell({ credits, product, loading, onBuy, onNew }: { credits: number; product?: { configured: boolean; amountMinor: number | null; currency: string | null }; loading: boolean; onBuy: () => void; onNew: () => void }) {
  const price = product?.amountMinor ? new Intl.NumberFormat("es-UY", { style: "currency", currency: product.currency ?? "USD" }).format(product.amountMinor / 100) : "USD 6,99";
  return <div className="tarot-surface-elevated mt-8 p-5 sm:p-7"><p className="tarot-kicker">{credits ? `${credits} créditos disponibles` : "Si querés seguir"}</p><h2 className="mt-2 font-serif text-2xl text-foreground">Tres lecturas adicionales</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Cada lectura paga incluye una nueva pregunta, una nueva tirada de tres cartas y una interpretación completa.</p><p className="mt-5 font-serif text-3xl text-foreground">{price}</p><Button onClick={credits ? onNew : onBuy} disabled={loading || (!product?.configured && !credits)} size="lg" className="tarot-primary-action mt-5 h-14 w-full font-semibold">{credits ? "Hacer una nueva lectura" : loading ? "Preparando pago…" : "Comprar pack de 3 lecturas"}<ArrowRight className="ml-2 h-4 w-4" /></Button></div>;
}

function Paywall({ credits, product, email, consent, loading, onEmail, onConsent, onBack, onBuy }: { credits: number; product?: { configured: boolean; amountMinor: number | null; currency: string | null }; email: string; consent: boolean; loading: boolean; onEmail: (value: string) => void; onConsent: (value: boolean) => void; onBack: () => void; onBuy: () => void }) {
  const price = product?.amountMinor ? new Intl.NumberFormat("es-UY", { style: "currency", currency: product.currency ?? "USD" }).format(product.amountMinor / 100) : "USD 6,99";
  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());
  return <section className="tarot-page max-w-xl py-10 sm:py-20 fade-in"><Button variant="ghost" onClick={onBack} className="mb-7 -ml-2 text-muted-foreground hover:bg-transparent hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button><div className="tarot-surface px-5 py-10 text-center sm:px-10"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--tarot-border)] bg-[var(--tarot-surface-elevated)] text-[var(--tarot-accent-hover)]"><Mail className="h-5 w-5" /></span><p className="tarot-kicker mt-5">Tres lecturas adicionales</p><h1 className="mt-3 font-serif text-4xl text-foreground">Seguí cuando quieras</h1><p className="mt-5 leading-relaxed text-muted-foreground">Cada lectura incluye una nueva pregunta, una tirada de tres cartas y su interpretación completa.</p><p className="mt-8 font-serif text-4xl text-foreground">{price}</p><p className="mt-1 text-sm text-muted-foreground">por las 3 lecturas</p><label htmlFor="checkout-email" className="mt-8 block text-left text-sm font-medium text-foreground">Tu email para guardar y recuperar tus créditos</label><input id="checkout-email" type="email" value={email} onChange={event => onEmail(event.target.value)} placeholder="vos@ejemplo.com" className="mt-2 h-14 w-full rounded-[var(--tarot-radius-sm)] border border-[var(--tarot-border)] bg-[oklch(0.17_0.032_307_/_78%)] px-4 text-foreground outline-none focus:border-[var(--tarot-accent)] focus:ring-2 focus:ring-[var(--tarot-accent)]/25" /><label className="mt-5 flex cursor-pointer gap-3 text-left text-sm leading-relaxed text-muted-foreground"><input type="checkbox" checked={consent} onChange={event => onConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[var(--tarot-accent)]" />Sí, quiero recibir novedades y contenidos de Tarot de Medianoche.</label><Button onClick={onBuy} disabled={loading || !product?.configured || !validEmail} size="lg" className="tarot-primary-action mt-8 h-14 w-full font-semibold">{loading ? "Preparando pago…" : "Comprar pack de 3 lecturas"}<ArrowRight className="ml-2 h-4 w-4" /></Button><p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">El consentimiento de novedades es opcional y podés retirarlo cuando quieras.</p></div></section>;
}

function CheckoutStatus({ status, loading, onBack }: { status?: "checkout_created" | "paid"; loading: boolean; onBack: () => void }) { return <section className="tarot-page max-w-xl py-12 sm:py-20 fade-in"><div className="tarot-surface px-6 py-10 text-center sm:px-10"><Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--tarot-accent-hover)]" /><p className="tarot-kicker mt-4">Pago</p><h1 className="mt-3 font-serif text-3xl text-foreground">{status === "paid" ? "Pack acreditado" : "Estamos verificando tu pago"}</h1><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{status === "paid" ? "Tus créditos ya están disponibles." : loading ? "Esperá un momento mientras confirmamos el pago." : "Cuando Dodo confirme el pago, vas a poder hacer nuevas lecturas."}</p><Button variant="ghost" className="mt-5" onClick={onBack}>Volver</Button></div></section>; }
