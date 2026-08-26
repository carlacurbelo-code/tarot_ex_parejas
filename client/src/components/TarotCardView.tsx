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
        "relative flex select-none flex-col items-center justify-center overflow-hidden rounded-[1.05rem] border-[1.5px] transition-[border-color,box-shadow] duration-200",
        sizeMap[size],
        back
          ? "border-[oklch(0.83_0.065_317)] bg-[radial-gradient(circle_at_22%_18%,oklch(0.91_0.075_316/.95),transparent_30%),radial-gradient(circle_at_79%_74%,oklch(0.9_0.06_173/.8),transparent_36%),linear-gradient(145deg,oklch(0.86_0.045_313),oklch(0.78_0.06_288))] text-[oklch(0.42_0.075_300)] shadow-[0_12px_24px_oklch(0.1_0.03_300/.28),inset_0_1px_0_oklch(1_0_0/.72)]"
          : "border-[oklch(0.84_0.07_318)] bg-[radial-gradient(circle_at_16%_16%,oklch(0.95_0.052_315/.95),transparent_32%),radial-gradient(circle_at_83%_80%,oklch(0.9_0.08_172/.72),transparent_40%),linear-gradient(145deg,oklch(0.94_0.035_320),oklch(0.84_0.057_286))] shadow-[0_12px_24px_oklch(0.1_0.03_300/.24),inset_0_1px_0_oklch(1_0_0/.8)]",
        isReversed && "rotate-180",
        selected && "-translate-y-1 ring-2 ring-[oklch(0.66_0.08_309)] ring-offset-2 ring-offset-[var(--tarot-void)] shadow-[0_16px_30px_oklch(0.1_0.03_300/.34)]",
        isClickable && !selected && "cursor-pointer hover:-translate-y-1 hover:border-[oklch(0.68_0.085_308)] hover:shadow-[0_16px_30px_oklch(0.1_0.03_300/.32)]",
        !isClickable && "cursor-default",
        className,
      )}
    >
      <div className="h-full w-full">
        {back ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="absolute inset-1.5 rounded-[0.78rem] border border-[oklch(0.91_0.065_87/.86)]" />
            <div className="absolute inset-2.5 rounded-[0.58rem] border border-[oklch(0.57_0.08_300/.62)]" />
            <div className="absolute inset-4 rounded-[0.42rem] border border-[oklch(0.94_0.07_318/.68)]" />
            <span className="font-serif text-2xl text-[oklch(0.52_0.09_301/.84)] drop-shadow-[0_1px_0_oklch(1_0_0/.7)]">✦</span>
          </div>
        ) : revealed ? (
          imageSrc ? (
            <div className="tarot-card-reveal h-full w-full">
              <img src={imageSrc} alt={name ?? "Ilustración de tarot"} loading={isClickable ? "lazy" : "eager"} decoding="async" className="block h-full w-full object-cover" />
            </div>
          ) : (
            <div className="tarot-card-reveal flex h-full w-full flex-col items-center justify-between p-2.5 sm:p-3">
              <div className="flex flex-1 items-center justify-center">
                <span className="font-serif text-2xl text-[oklch(0.47_0.088_300)] drop-shadow-[0_1px_0_oklch(1_0_0/.7)] sm:text-3xl">{emoji}</span>
              </div>
              <div className="text-center">
                <p className="font-serif font-medium leading-tight text-[oklch(0.38_0.065_300)]">{name}</p>
              </div>
            </div>
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-3">
            {imageSrc ? <img src={imageSrc} alt={name ?? "Ilustración de tarot"} loading="lazy" decoding="async" className="h-full w-full rounded-[0.55rem] object-cover shadow-[inset_0_0_0_1px_oklch(1_0_0/.5)]" /> : <span className="text-2xl text-[oklch(0.47_0.088_300)]/80">{emoji}</span>}
            {!imageSrc && <p className="mt-2 font-serif text-center leading-tight text-[oklch(0.38_0.065_300)]">{name}</p>}
          </div>
        )}
      </div>
    </button>
  );
}
