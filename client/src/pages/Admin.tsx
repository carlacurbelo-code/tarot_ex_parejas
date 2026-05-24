import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Copy, Loader2, LogOut, Music, Settings as SettingsIcon, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function Admin() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return <CenterLoader />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full p-8 text-center bg-card">
          <h1 className="font-serif text-2xl">Panel administrador</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Iniciá sesión para gestionar tus pedidos.
          </p>
          <Button asChild size="lg" className="mt-6 w-full">
            <a href={getLoginUrl("/admin")}>Iniciar sesión</a>
          </Button>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="font-serif text-2xl">Acceso restringido</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Esta sección es solo para la administradora.
          </p>
          <Button onClick={logout} variant="outline" className="mt-6">
            Cerrar sesión
          </Button>
        </Card>
      </div>
    );
  }

  return <AdminPanel onLogout={logout} />;
}

function CenterLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const ordersQuery = trpc.admin.listOrders.useQuery();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const paid = ordersQuery.data?.filter(o => o.paymentStatus === "paid" && o.deliveryStatus === "pending") ?? [];
  const completed = ordersQuery.data?.filter(o => o.deliveryStatus === "completed") ?? [];
  const pending = ordersQuery.data?.filter(o => o.paymentStatus === "pending") ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/40 sticky top-0 backdrop-blur z-10">
        <div className="container max-w-5xl flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg">Panel · Lecturas</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon className="h-4 w-4 mr-2" />Configuración
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-8 space-y-10">
        <Stats
          paid={paid.length}
          completed={completed.length}
          totalUsd={completed.reduce((acc, o) => acc + Number(o.amountPaid ?? 0), 0)}
        />

        <Section title="Para entregar" subtitle="Pagos confirmados, faltan audios.">
          {ordersQuery.isLoading ? (
            <CenterLoader />
          ) : paid.length === 0 ? (
            <Empty text="No hay pedidos pendientes de entrega." />
          ) : (
            <div className="space-y-4">
              {paid.map(o => (
                <OrderCard key={o.id} order={o} onChanged={() => ordersQuery.refetch()} highlight />
              ))}
            </div>
          )}
        </Section>

        <Section title="Esperando pago">
          {pending.length === 0 ? (
            <Empty text="No hay pedidos esperando pago." />
          ) : (
            <div className="space-y-4">
              {pending.map(o => (
                <OrderCard key={o.id} order={o} onChanged={() => ordersQuery.refetch()} />
              ))}
            </div>
          )}
        </Section>

        <Section title="Completados">
          {completed.length === 0 ? (
            <Empty text="Aún no entregaste lecturas." />
          ) : (
            <div className="space-y-4">
              {completed.map(o => (
                <OrderCard key={o.id} order={o} onChanged={() => ordersQuery.refetch()} />
              ))}
            </div>
          )}
        </Section>
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

function Stats({ paid, completed, totalUsd }: { paid: number; completed: number; totalUsd: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Para entregar</p>
        <p className="mt-1 font-serif text-2xl">{paid}</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Completadas</p>
        <p className="mt-1 font-serif text-2xl">{completed}</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Recaudado</p>
        <p className="mt-1 font-serif text-2xl">USD {totalUsd.toFixed(0)}</p>
      </Card>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-serif text-xl">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card className="p-6 bg-muted/30 border-dashed text-center text-sm text-muted-foreground">
      {text}
    </Card>
  );
}

interface AdminOrder {
  id: number;
  accessToken: string;
  clientName: string | null;
  clientEmail: string | null;
  situation: string;
  premiumQuestion: string | null;
  selectedCards: string[];
  freeReading: string | null;
  paymentStatus: "pending" | "paid" | "refunded";
  deliveryStatus: "pending" | "completed";
  amountPaid: string | null;
  currency: string | null;
  audioFileKey: string | null;
  createdAt: Date;
  paidAt: Date | null;
  completedAt: Date | null;
}

function OrderCard({ order, onChanged, highlight = false }: { order: AdminOrder; onChanged: () => void; highlight?: boolean }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const upload = trpc.admin.uploadAudio.useMutation();
  const markDone = trpc.admin.markCompleted.useMutation();

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("El archivo supera 25 MB.");
      return;
    }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binary);
      await upload.mutateAsync({
        orderId: order.id,
        filename: file.name,
        contentType: file.type || "audio/mpeg",
        dataBase64: base64,
      });
      await markDone.mutateAsync({ orderId: order.id });
      toast.success("Audio subido y pedido marcado como completado.");
      onChanged();
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo subir el audio.");
    } finally {
      setUploading(false);
    }
  };

  const handleMarkDone = async () => {
    try {
      await markDone.mutateAsync({ orderId: order.id });
      toast.success("Marcado como completado.");
      onChanged();
    } catch (e) {
      toast.error("No se pudo marcar como completado.");
    }
  };

  const clientLink = `${window.location.origin}/mi-lectura/${order.accessToken}`;

  return (
    <Card className={`p-5 ${highlight ? "border-primary/40 bg-primary/[0.03]" : ""}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-serif text-lg">#{order.id} · {order.clientName ?? "Sin nombre"}</p>
            <PaymentBadge status={order.paymentStatus} />
            <DeliveryBadge status={order.deliveryStatus} />
          </div>
          {order.clientEmail && (
            <p className="text-sm text-muted-foreground">{order.clientEmail}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Creado: {new Date(order.createdAt).toLocaleString()}
            {order.paidAt && <> · Pagado: {new Date(order.paidAt).toLocaleString()}</>}
          </p>
        </div>
        <div className="text-right">
          {order.amountPaid && (
            <p className="font-serif text-xl">USD {order.amountPaid}</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Situación</p>
          <p className="mt-1.5 text-sm whitespace-pre-line leading-relaxed">{order.situation}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Pregunta premium</p>
          <p className="mt-1.5 text-sm whitespace-pre-line leading-relaxed">
            {order.premiumQuestion ?? <span className="italic text-muted-foreground">— sin pregunta —</span>}
          </p>
        </div>
      </div>

      {order.freeReading && (
        <details className="mt-4 group">
          <summary className="text-xs uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground">
            Lectura inicial generada
          </summary>
          <p className="mt-2 text-sm whitespace-pre-line leading-relaxed bg-muted/30 p-3 rounded">{order.freeReading}</p>
        </details>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.ogg"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
        {order.paymentStatus === "paid" && (
          <Button
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Subiendo</>
            ) : order.audioFileKey ? (
              <><Upload className="h-4 w-4 mr-2" />Reemplazar audio</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" />Subir audio</>
            )}
          </Button>
        )}
        {order.audioFileKey && (
          <Button size="sm" variant="outline" asChild>
            <a href={`/manus-storage/${order.audioFileKey}`} target="_blank" rel="noopener noreferrer">
              <Music className="h-4 w-4 mr-2" />Escuchar
            </a>
          </Button>
        )}
        {order.paymentStatus === "paid" && order.deliveryStatus === "pending" && (
          <Button size="sm" variant="outline" onClick={handleMarkDone}>
            <CheckCircle2 className="h-4 w-4 mr-2" />Marcar completado
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            navigator.clipboard.writeText(clientLink);
            toast.success("Enlace para la cliente copiado");
          }}
        >
          <Copy className="h-4 w-4 mr-2" />Copiar enlace cliente
        </Button>
      </div>
    </Card>
  );
}

function PaymentBadge({ status }: { status: "pending" | "paid" | "refunded" }) {
  if (status === "paid") return <Badge className="bg-primary/15 text-primary border border-primary/30">Pagado</Badge>;
  if (status === "refunded") return <Badge variant="secondary">Reembolsado</Badge>;
  return <Badge variant="outline">Sin pago</Badge>;
}

function DeliveryBadge({ status }: { status: "pending" | "completed" }) {
  if (status === "completed") return <Badge className="bg-secondary text-secondary-foreground border border-border">Entregado</Badge>;
  return <Badge variant="outline">Pendiente</Badge>;
}

function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const settingsQuery = trpc.admin.getSettings.useQuery(undefined, { enabled: open });
  const update = trpc.admin.updateSettings.useMutation();
  const utils = trpc.useUtils();

  const [price, setPrice] = useState("");
  const [paypalLink, setPaypalLink] = useState("");

  // Sync when opened
  useState(() => {});
  if (open && settingsQuery.data && price === "" && paypalLink === "") {
    setPrice(settingsQuery.data.priceUsd);
    setPaypalLink(settingsQuery.data.paypalLink);
  }

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        priceUsd: price,
        paypalLink: paypalLink.trim(),
      });
      toast.success("Configuración guardada");
      utils.admin.getSettings.invalidate();
      utils.tarot.getPremiumPrice.invalidate();
      onOpenChange(false);
    } catch (e: any) {
      toast.error("No se pudo guardar. Revisá el formato del precio (ej: 15.00) y el link PayPal.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setPrice(""); setPaypalLink(""); }}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
          <DialogDescription>Precio de la lectura premium y enlace PayPal.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="price">Precio (USD)</Label>
            <Input
              id="price"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="15"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ej: 15 o 19.99. Se muestra a las clientes en la página de lectura.
            </p>
          </div>
          <div>
            <Label htmlFor="paypal">Enlace PayPal.me</Label>
            <Input
              id="paypal"
              value={paypalLink}
              onChange={e => setPaypalLink(e.target.value)}
              placeholder="https://paypal.me/tunombre"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tu link personal de PayPal.me. Si lo dejás vacío, las clientes no podrán pagar.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
