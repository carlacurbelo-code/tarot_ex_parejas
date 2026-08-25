import { cn } from "@/lib/utils";
import type { CardOrientation } from "@shared/tarot";

interface TarotCardViewProps {
  name?: string;
  emoji?: string;
  imageSrc?: string;
  back?: boolean;
  selected?: boolean;
  revealed?: boolean;
  orientation?: CardOrientation;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-[6.75rem] w-[4.25rem] text-[0.65rem] sm:h-32 sm:w-20 sm:text-xs",
  md: "h-40 w-24 text-sm",
  lg: "h-60 w-[9.5rem] text-base",
};

export function TarotCardView({
  name,
  emoji,
  imageSrc,
  back = false,
  selected = false,
  revealed = false,
  orientation = "upright",
  onClick,
  size = "md",
  className,
}: TarotCardViewProps) {
  const isClickable = !!onClick;
  const isReversed = revealed && orientation === "reversed";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      aria-label={back ? "Carta boca abajo" : `${name ?? "Carta"}${orientation === "reversed" && revealed ? ", invertida" : ", derecha"}`}
      className={cn(
        "relative flex select-none flex-col items-center justify-center overflow-hidden rounded-[var(--tarot-radius-sm)] border transition-all duration-200",
        sizeMap[size],
        back
          ? "border-[var(--tarot-border)] bg-[radial-gradient(circle_at_50%_42%,oklch(0.37_0.072_315),transparent_36%),linear-gradient(145deg,var(--tarot-surface-elevated),var(--tarot-night))] text-[var(--tarot-ink)] shadow-[var(--tarot-shadow)]"
          : "border-[var(--tarot-border)] bg-[linear-gradient(145deg,oklch(0.32_0.052_315),var(--tarot-surface))] shadow-[var(--tarot-shadow)]",
        selected && "-translate-y-1 ring-2 ring-[var(--tarot-accent)] ring-offset-2 ring-offset-[var(--tarot-void)] shadow-[var(--tarot-shadow-lift)]",
        isClickable && !selected && "cursor-pointer hover:-translate-y-1 hover:border-[var(--tarot-accent)]/75 hover:shadow-[var(--tarot-shadow-lift)]",
        !isClickable && "cursor-default",
        className,
      )}
    >
      <div
        className="w-full h-full"
        style={isReversed ? { transform: "rotate(180deg)" } : undefined}
      >
        {back ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="absolute inset-2 rounded-[calc(var(--tarot-radius-sm)-0.25rem)] border border-[var(--tarot-border)]" />
            <div className="absolute inset-3 rounded-[calc(var(--tarot-radius-sm)-0.45rem)] border border-[var(--tarot-border)]/55" />
            <span className="font-serif text-2xl text-[var(--tarot-accent-hover)]/80">✦</span>
          </div>
        ) : revealed ? (
          <div className="flex h-full w-full flex-col items-center justify-between p-2.5 sm:p-3">
            <div className="flex flex-1 items-center justify-center">
              {imageSrc ? <img src={imageSrc} alt="" className="h-full w-full object-cover" /> : <span className="font-serif text-2xl text-[var(--tarot-accent-hover)] sm:text-3xl">{emoji}</span>}
            </div>
            <div className="text-center">
              <p className="font-serif font-medium leading-tight text-foreground">{name}</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-3">
            {imageSrc ? <img src={imageSrc} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl text-[var(--tarot-accent-hover)]/75">{emoji}</span>}
            <p className="mt-2 font-serif text-center leading-tight text-foreground">{name}</p>
          </div>
        )}
      </div>
    </button>
  );
}
