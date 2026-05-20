import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import bg from "@/assets/bg-triagem.jpg";

export const Route = createFileRoute("/triagem")({
  head: () => ({
    meta: [
      { title: "Triagem — CAES APAE Santa Maria de Jetibá-ES" },
      {
        name: "description",
        content:
          "Saiba como realizar a triagem no CAES da APAE Santa Maria de Jetibá-ES, via UBS e Serviço Social.",
      },
      { property: "og:title", content: "Triagem — CAES APAE Santa Maria de Jetibá-ES" },
      {
        property: "og:description",
        content: "Fluxo de triagem no CAES: UBS, sistema MV e encaminhamento ao Serviço Social.",
      },
    ],
    links: [{ rel: "canonical", href: "/triagem" }],
  }),
  component: TriagemPage,
});

function TriagemPage() {
  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.95)), url(${bg})`,
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Button
          asChild
          variant="ghost"
          className="mb-8 -ml-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a página inicial
          </Link>
        </Button>

        <div className="rounded-3xl bg-card p-10 shadow-[var(--shadow-card)] md:p-14">
          <div className="mb-6 inline-flex rounded-2xl bg-secondary p-4 text-primary">
            <ClipboardList className="h-8 w-8" />
          </div>
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            CAES — APAE Santa Maria de Jetibá-ES
          </div>
          <h1 className="text-balance text-4xl font-extrabold uppercase leading-tight text-foreground md:text-5xl">
            Como realizar a triagem
          </h1>

          <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              Para realizar a triagem no CAES, é necessário que o usuário procure inicialmente a
              Unidade Básica de Saúde (UBS) de sua região para atendimento médico. Durante a
              consulta, solicite ao médico da unidade que realize a inserção das informações no
              sistema MV e faça o encaminhamento para a APAE/CAES.
            </p>
            <p>
              Além disso, é importante solicitar também o encaminhamento para o Serviço Social, que
              será responsável pelo acolhimento e orientações necessárias para continuidade do
              atendimento.
            </p>
            <p>
              Esse fluxo é fundamental para garantir um atendimento mais organizado, acolhedor e
              adequado às necessidades de cada usuário.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-primary px-8 py-6 text-sm font-bold uppercase tracking-wider hover:bg-primary/90"
            >
              <Link to="/">Voltar para o início</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-2 px-8 py-6 text-sm font-bold uppercase tracking-wider"
            >
              <Link to="/servicos">Ver serviços</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
