import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Activity,
  HeartHandshake,
  Apple,
  Mic,
  Ear,
  Smile,
  Hand,
  Brain,
  Stethoscope,
  Baby,
  HeartPulse,
  Puzzle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import bg from "@/assets/bg-servicos.jpg";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — CAES APAE Santa Maria de Jetibá-ES" },
      {
        name: "description",
        content:
          "Conheça os serviços do CAES — APAE Santa Maria de Jetibá-ES: fisioterapia, fonoaudiologia, psicologia, odontologia e mais.",
      },
      { property: "og:title", content: "Serviços — CAES APAE Santa Maria de Jetibá-ES" },
      {
        property: "og:description",
        content: "Atendimento multidisciplinar especializado para pessoas com deficiência.",
      },
    ],
    links: [{ rel: "canonical", href: "/servicos" }],
  }),
  component: ServicosPage,
});

const services = [
  {
    icon: Activity,
    title: "Fisioterapia",
    desc: "Reabilitação motora e funcional, estimulando autonomia, força e qualidade de movimento dos usuários da APAE.",
  },
  {
    icon: HeartHandshake,
    title: "Assistência Social",
    desc: "Acolhimento, orientação e suporte às famílias, garantindo acesso a direitos e à rede de proteção social.",
  },
  {
    icon: Apple,
    title: "Nutrição",
    desc: "Avaliação e acompanhamento nutricional individualizado, promovendo saúde, bem-estar e hábitos alimentares adequados.",
  },
  {
    icon: Mic,
    title: "Fonoaudiologia",
    desc: "Atendimento voltado à comunicação, linguagem, fala, audição e funções orais dos usuários.",
  },
  {
    icon: Ear,
    title: "Teste da Orelhinha",
    desc: "Triagem auditiva neonatal aberta a toda a comunidade do município, identificando precocemente alterações auditivas em bebês.",
  },
  {
    icon: Smile,
    title: "Odontologia",
    desc: "Cuidado odontológico especializado e adaptado às necessidades das pessoas com deficiência, com acolhimento e segurança.",
  },
  {
    icon: Hand,
    title: "Terapia Ocupacional",
    desc: "Estímulo às atividades da vida diária, habilidades funcionais e participação social dos usuários da APAE.",
  },
  {
    icon: Brain,
    title: "Psicologia",
    desc: "Acompanhamento emocional, comportamental e de desenvolvimento para usuários e seus familiares.",
  },
  {
    icon: Stethoscope,
    title: "Atendimento Médico — Clínico Geral",
    desc: "Avaliações clínicas, acompanhamento e cuidado integral à saúde geral dos usuários do CAES.",
  },
  {
    icon: Baby,
    title: "Atendimento Médico — Neuropediatra",
    desc: "Avaliação e acompanhamento neurológico de crianças e adolescentes com deficiência ou alterações no desenvolvimento.",
  },
  {
    icon: HeartPulse,
    title: "Atendimento Médico — Psiquiatra",
    desc: "Avaliação e acompanhamento da saúde mental dos usuários, com cuidado contínuo e humanizado.",
  },
  {
    icon: Puzzle,
    title: "PRONAS — TEA",
    desc: "Programa especializado para pessoas com Transtorno do Espectro Autista, com equipe multidisciplinar e abordagem individualizada.",
  },
];

function ServicosPage() {
  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.95)), url(${bg})`,
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-16">
        <Button
          asChild
          variant="ghost"
          className="mb-8 -ml-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a página inicial
          </Link>
        </Button>

        <div className="mb-12 max-w-3xl">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            CAES — APAE Santa Maria de Jetibá-ES
          </div>
          <h1 className="text-balance text-4xl font-extrabold uppercase leading-tight text-foreground md:text-5xl">
            Nossos Serviços
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Atendimento multidisciplinar especializado, com equipe qualificada e cuidado humanizado
            para pessoas com deficiência e suas famílias.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl bg-card p-7 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
            >
              <div className="mb-5 inline-flex rounded-2xl bg-secondary p-4 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <s.icon className="h-7 w-7" />
              </div>
              <h2 className="mb-2 text-base font-bold uppercase tracking-wider text-foreground">
                {s.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-4">
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
            <Link to="/triagem">Como fazer a triagem</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
