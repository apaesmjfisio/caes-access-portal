import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logoApae from "@/assets/logo-apae.png";
import bgImage from "@/assets/bg-configuracoes.jpg";
import { getSession, type Session } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CAES" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { navigate({ to: "/login" }); return; }
    setSession(s);
  }, [navigate]);

  if (!session) return null;

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.97)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/app" className="flex items-center gap-3">
            <img src={logoApae} alt="APAE" className="h-9 w-auto" />
            <div className="leading-tight">
              <div className="text-sm font-bold">CAES · Dashboard</div>
              <div className="text-xs text-muted-foreground">Indicadores e relatórios</div>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/app" })}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <BarChart3 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Dashboard do CAES</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Esta área apresentará os indicadores do centro mediante seleções e filtros
            (período, profissional, especialidade, agenda, status, etc.). Os filtros
            serão definidos em uma etapa futura.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-4 w-4" /> Filtros em construção
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {["Atendimentos do mês", "Taxa de comparecimento", "Pacientes ativos"].map((t) => (
            <Card key={t} className="p-5">
              <div className="text-xs font-semibold uppercase text-muted-foreground">{t}</div>
              <div className="mt-2 text-3xl font-bold">—</div>
              <div className="mt-1 text-xs text-muted-foreground">Aguardando filtros</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
