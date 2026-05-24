import { cn } from "@/lib/utils";

interface TarotCardViewProps {
  name?: string;
  emoji?: string;
  back?: boolean;
  selected?: boolean;
  revealed?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-20 h-32 text-xs",
  md: "w-24 h-40 text-sm",
  lg: "w-32 h-52 text-base",
};

export function TarotCardView({
  name,
  emoji,
  back = false,
  selected = false,
  revealed = false,
  onClick,
  size = "md",
  className,
}: TarotCardViewProps) {
  const isClickable = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        "relative rounded-lg border transition-all duration-300 flex flex-col items-center justify-center select-none overflow-hidden",
        sizeMap[size],
        back
          ? "bg-gradient-to-br from-[oklch(0.42_0.04_240)] to-[oklch(0.32_0.035_245)] border-[oklch(0.55_0.05_240)]/40 text-[oklch(0.85_0.02_70)] shadow-md"
          : "bg-card border-border shadow-sm",
        selected && "ring-2 ring-primary/70 ring-offset-2 ring-offset-background -translate-y-1 shadow-lg",
        isClickable && !selected && "hover:-translate-y-1 hover:shadow-md cursor-pointer",
        !isClickable && "cursor-default",
        className,
      )}
      aria-label={back ? "Carta boca abajo" : name}
    >
      {back ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="absolute inset-2 border border-[oklch(0.65_0.04_55)]/30 rounded-md" />
          <div className="absolute inset-3 border border-[oklch(0.65_0.04_55)]/20 rounded-md" />
          <span className="font-serif text-2xl text-[oklch(0.78_0.045_55)]/60">✦</span>
        </div>
      ) : revealed ? (
        <div className="flex flex-col items-center justify-between w-full h-full p-3">
          <div className="flex-1 flex items-center justify-center">
            <span className="text-3xl text-primary/80 font-serif">{emoji}</span>
          </div>
          <div className="text-center">
            <p className="font-serif font-medium leading-tight text-foreground">{name}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full p-3">
          <span className="text-2xl text-muted-foreground">{emoji}</span>
          <p className="mt-2 font-serif text-center leading-tight text-foreground">{name}</p>
        </div>
      )}
    </button>
  );
}
