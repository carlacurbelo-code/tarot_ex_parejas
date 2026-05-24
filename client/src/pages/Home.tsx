import { TarotCardView } from "@/components/TarotCardView";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteFooter } from "@/components/SiteFooter";
import type { TarotCard } from "@shared/tarot";
import { TAROT_DECK } from "@shared/tarot";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// ─── CONFIGURACIÓN ──────────────────────────────────────────────
// Reemplazá este número con tu WhatsApp real (sin espacios ni guiones)
const WHATSAPP_NUMBER = "598992435293";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hola! Acabo de hacer mi lectura gratuita y quiero la lectura del ex + 3 preguntas."
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

// ─── TEXTOS POR CARTA ───────────────────────────────────────────
const CARD_TEXTS: Record<string, { dinamica: string; patron: string; tendencia: string }> = {
  fool:         { dinamica: "Hay impulso y distancia emocional. Algo se inicia sin dirección clara.", patron: "Aparecen movimientos repentinos seguidos de desconexión.", tendencia: "La energía no se estabiliza si no hay definición clara." },
  magician:     { dinamica: "Hay atracción mental, pero no siempre acción coherente.", patron: "Comunicación intermitente, con intención pero sin constancia.", tendencia: "Potencial activo, pero disperso si no se concreta." },
  highpriestess:{ dinamica: "Silencio emocional con mucha carga interna no expresada.", patron: "Observación pasiva, interpretación de señales externas.", tendencia: "Estancamiento si no se rompe el silencio." },
  empress:      { dinamica: "Hay vínculo afectivo con tendencia a idealización.", patron: "Dar más de lo que se recibe.", tendencia: "Crecimiento solo si hay reciprocidad real." },
  emperor:      { dinamica: "Control, estructura, pero rigidez emocional.", patron: "Definición parcial sin apertura emocional completa.", tendencia: "Estabilidad posible si baja el control." },
  hierophant:   { dinamica: "Vínculo guiado por expectativas o reglas previas.", patron: "Repetición de patrones aprendidos en relaciones anteriores.", tendencia: "Evolución lenta, estructurada." },
  lovers:       { dinamica: "Atracción fuerte con ambivalencia en la decisión.", patron: "Ida y vuelta entre conexión y duda.", tendencia: "Se activa decisión o se diluye el vínculo." },
  chariot:      { dinamica: "Movimiento rápido con dirección emocional intensa.", patron: "Acercamientos impulsivos seguidos de retirada.", tendencia: "Avance solo si hay dirección clara." },
  strength:     { dinamica: "Tensión emocional contenida.", patron: "Aguante prolongado en situaciones inciertas.", tendencia: "Se sostiene, pero con desgaste interno." },
  hermit:       { dinamica: "Distancia emocional y búsqueda interna.", patron: "Retiro prolongado sin cierre claro.", tendencia: "Lentitud en la resolución del vínculo." },
  wheel:        { dinamica: "Cambios cíclicos en la conexión.", patron: "Repetición de escenarios similares.", tendencia: "Lo mismo tiende a volver si no se interviene el patrón." },
  justice:      { dinamica: "Evaluación racional del vínculo.", patron: "Comparación constante entre lo dado y lo recibido.", tendencia: "Decisión basada en equilibrio o desequilibrio." },
  hangedman:    { dinamica: "Estancamiento emocional con espera pasiva.", patron: "Postergación de decisiones importantes.", tendencia: "Inmovilidad si no hay cambio interno." },
  death:        { dinamica: "Transformación interna del vínculo.", patron: "Cierre emocional parcial o simbólico.", tendencia: "Fin de una etapa clara o inevitable." },
  temperance:   { dinamica: "Intento de equilibrio emocional.", patron: "Ajustes constantes para sostener el vínculo.", tendencia: "Estabilidad solo con reciprocidad." },
  devil:        { dinamica: "Apego fuerte con carga emocional intensa.", patron: "Vínculo difícil de soltar aunque genere malestar.", tendencia: "Repetición de dependencia emocional." },
  tower:        { dinamica: "Ruptura de estructura emocional previa.", patron: "Crisis inesperadas en el vínculo.", tendencia: "Reconfiguración obligatoria." },
  star:         { dinamica: "Esperanza emocional activa.", patron: "Idealización de futuro posible.", tendencia: "Apertura si hay acciones concretas." },
  moon:         { dinamica: "Confusión emocional y señales poco claras.", patron: "Interpretación subjetiva de lo que ocurre.", tendencia: "Inestabilidad si no hay claridad externa." },
  sun:          { dinamica: "Claridad emocional y conexión directa.", patron: "Comunicación abierta y sincera.", tendencia: "Expansión del vínculo si se mantiene." },
  judgement:    { dinamica: "Reaparición de algo que parecía cerrado.", patron: "Retornos o reactivaciones del vínculo.", tendencia: "Decisión definitiva inminente." },
  world:        { dinamica: "Cierre de ciclo emocional.", patron: "Integración de la experiencia vivida.", tendencia: "Finalización o transición clara." },
  ace_cups:     { dinamica: "Inicio emocional o reactivación afectiva.", patron: "Apertura emocional repentina.", tendencia: "Posibilidad de nuevo comienzo emocional." },
  two_cups:     { dinamica: "Conexión recíproca potencial.", patron: "Interacción emocional equilibrada.", tendencia: "Unión posible si se sostiene." },
  three_cups:   { dinamica: "Interacción social que influye en el vínculo.", patron: "Interferencias externas en la conexión.", tendencia: "Dinámica inestable por terceros." },
  five_cups:    { dinamica: "Enfoque en pérdida emocional.", patron: "Dificultad para ver lo que aún está presente.", tendencia: "Persistencia del duelo emocional." },
  six_cups:     { dinamica: "Vínculo ligado al pasado.", patron: "Nostalgia y retorno emocional recurrente.", tendencia: "Repetición de dinámicas anteriores." },
  seven_cups:   { dinamica: "Confusión por múltiples posibilidades.", patron: "Idealización de escenarios no concretos.", tendencia: "Dificultad para decidir o concretar." },
  eight_cups:   { dinamica: "Alejamiento emocional progresivo.", patron: "Búsqueda de algo distinto al vínculo actual.", tendencia: "Distancia creciente." },
  ten_cups:     { dinamica: "Ideal de vínculo completo o familiar.", patron: "Búsqueda de estabilidad emocional total.", tendencia: "Consolidación si hay base real." },
};

// ─── TIPOS ──────────────────────────────────────────────────────
type Step = "intro" | "cards" | "result";

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState<Step>("intro");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shuffledDeck, setShuffledDeck] = useState<TarotCard[]>([]);

  useEffect(() => {
    const arr = [...TAROT_DECK];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffledDeck(arr);
  }, []);

  const toggleCard = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const selectedCards = selectedIds.map(id => TAROT_DECK.find(c => c.id === id)!).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {step === "intro" && (
          <IntroSection onStart={() => setStep("cards")} />
        )}
        {step === "cards" && (
          <CardsSection
            deck={shuffledDeck}
            selectedIds={selectedIds}
            onToggle={toggleCard}
            onContinue={() => setStep("result")}
          />
        )}
        {step === "result" && (
          <ResultSection cards={selectedCards} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

// ─── PASO 1: INTRO ───────────────────────────────────────────────
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
          Elegí tres cartas. Recibí ahora una lectura sobre la dinámica real de tu vínculo.
        </p>
        <div className="mt-10">
          <Button
            onClick={onStart}
            size="lg"
            className="h-12 px-8 text-base font-medium"
          >
            Elegir mis 3 cartas
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
    </section>
  );
}

// ─── PASO 2: SELECCIÓN DE CARTAS ─────────────────────────────────
function CardsSection({
  deck,
  selectedIds,
  onToggle,
  onContinue,
}: {
  deck: TarotCard[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
}) {
  const cardOrder = useMemo(() => deck.map(c => c.id), [deck]);
  const remaining = 3 - selectedIds.length;

  return (
    <section className="container max-w-3xl pt-10 pb-24 fade-in">
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
            <div
              key={card.id}
              className="relative"
              style={{ animation: `fadeIn 0.5s ${cardOrder.indexOf(card.id) * 0.04}s both cubic-bezier(0.23, 1, 0.32, 1)` }}
            >
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
          disabled={selectedIds.length !== 3}
          size="lg"
          className="w-full h-12 text-base shadow-lg"
        >
          Ver mi lectura
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

// ─── PASO 3: RESULTADO + UPSELL ──────────────────────────────────
function ResultSection({ cards }: { cards: TarotCard[] }) {
  const [card1, card2, card3] = cards;
  const t1 = CARD_TEXTS[card1?.id ?? ""] ;
  const t2 = CARD_TEXTS[card2?.id ?? ""];
  const t3 = CARD_TEXTS[card3?.id ?? ""];

  return (
    <section className="container max-w-2xl pt-10 pb-16 fade-in">

      {/* Cartas elegidas */}
      <p className="text-center font-serif italic text-muted-foreground">Tu lectura</p>
      <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-center text-foreground leading-tight">
        Lo que dicen tus cartas
      </h1>

      <div className="mt-8 flex justify-center gap-3 sm:gap-4">
        {cards.map(card => (
          <TarotCardView
            key={card.id}
            name={card.name}
            emoji={card.emoji}
            revealed
            size="sm"
          />
        ))}
      </div>

      {/* Resultado en 3 líneas */}
      <Card className="mt-10 p-6 sm:p-8 bg-card border-border/60 shadow-sm space-y-5">
        {t1 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Dinámica del vínculo</p>
            <p className="font-serif text-base sm:text-lg leading-relaxed text-foreground">{t1.dinamica}</p>
          </div>
        )}
        {t2 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Patrón</p>
            <p className="font-serif text-base sm:text-lg leading-relaxed text-foreground">{t2.patron}</p>
          </div>
        )}
        {t3 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Tendencia</p>
            <p className="font-serif text-base sm:text-lg leading-relaxed text-foreground">{t3.tendencia}</p>
          </div>
        )}
      </Card>

      {/* Upsell */}
      <Card className="mt-8 p-6 sm:p-8 bg-gradient-to-br from-secondary/60 to-card border-border/60 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-primary mb-3">
          Si querés entender más
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl text-foreground leading-tight">
          Lectura del ex<br />
          <span className="italic">+ 3 preguntas</span>
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Una lectura íntima y personal sobre tu situación concreta, con respuesta a las 3 preguntas que más te rondan.
        </p>

        <ul className="mt-5 space-y-2 text-sm text-foreground">
          {[
            "Lectura personalizada para tu vínculo específico",
            "3 preguntas respondidas con detalle",
            "Entrega por WhatsApp en 24 hs",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="font-serif text-4xl text-foreground">USD 25</span>
          <span className="text-sm text-muted-foreground">precio único</span>
        </div>

        <Button
          asChild
          size="lg"
          className="mt-6 w-full h-12 text-base"
        >
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-5 w-5" />
            Quiero mi lectura completa
          </a>
        </Button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Respondemos por WhatsApp · Entrega en 24 hs
        </p>
      </Card>
    </section>
  );
}
