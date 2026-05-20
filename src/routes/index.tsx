import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Stethoscope, Users, HandHeart, ArrowRight, Phone, MapPin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-caes.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CAES — APAE Santa Maria de Jetibá-ES" },
      {
        name: "description",
        content:
          "Centro de Atendimento Especializado em Saúde — APAE Santa Maria de Jetibá-ES. Cuidado humanizado e atendimento multidisciplinar.",
      },
      { property: "og:title", content: "CAES — APAE Santa Maria de Jetibá-ES" },
      {
        property: "og:description",
        content: "Centro de Atendimento Especializado em Saúde — APAE Santa Maria de Jetibá-ES.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: LandingPage,
});

const nav = [
  { label: "Início", href: "#inicio" },
  { label: "Serviços", href: "#servicos" },
  { label: "Sobre", href: "#sobre" },
  { label: "Equipe", href: "#equipe" },
  { label: "Contato", href: "#contato" },
];

const services = [
  {
    icon: Stethoscope,
    title: "Atendimento Clínico",
    desc: "Consultas especializadas com equipe multidisciplinar dedicada ao cuidado integral.",
  },
  {
    icon: HandHeart,
    title: "Terapias Integradas",
    desc: "Fisioterapia, fonoaudiologia, terapia ocupacional e psicologia em um só lugar.",
  },
  {
    icon: Users,
    title: "Apoio à Família",
    desc: "Acolhimento, orientação e suporte contínuo para famílias e cuidadores.",
  },
  {
    icon: Heart,
    title: "Cuidado Humanizado",
    desc: "Cada pessoa é única — atendimento respeitoso, individualizado e afetuoso.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero with header */}
      <section
        id="inicio"
        className="relative min-h-[100vh] w-full overflow-hidden"
        style={{
          backgroundImage: `var(--gradient-hero), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "multiply",
        }}
      >
        {/* Header */}
        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="text-primary-foreground">
            <div className="text-xs font-medium uppercase tracking-[0.2em] opacity-80">APAE</div>
            <div className="text-lg font-bold leading-tight">CAES</div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/90 transition hover:text-accent"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <Link to="/login">
            <Button
              size="lg"
              className="rounded-full bg-accent px-6 font-bold uppercase tracking-wider text-accent-foreground shadow-[var(--shadow-soft)] hover:bg-accent/90"
            >
              Acesso Profissional
            </Button>
          </Link>
        </header>

        {/* Hero content */}
        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-120px)] max-w-5xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-accent">
            APAE — Santa Maria de Jetibá-ES
          </div>
          <h1 className="text-balance text-4xl font-extrabold uppercase leading-tight tracking-tight text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Centro de Atendimento
            <br />
            Especializado em Saúde
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-lg font-medium text-primary-foreground/90 sm:text-xl md:text-2xl">
            Cuidar, acolher e transformar vidas com excelência e amor.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-primary px-8 py-6 text-base font-bold uppercase tracking-wider shadow-[var(--shadow-soft)] hover:bg-primary/90"
            >
              <a href="#servicos">
                Conheça nossos serviços <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-2 border-primary-foreground bg-transparent px-8 py-6 text-base font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              <a href="#contato">Fale Conosco</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Services cards — overlapping the hero */}
      <section id="servicos" className="relative z-20 mx-auto -mt-20 max-w-7xl px-6">
        <div className="grid gap-6 rounded-3xl bg-card p-8 shadow-[var(--shadow-card)] md:grid-cols-2 lg:grid-cols-4 lg:p-12">
          {services.map((s) => (
            <div
              key={s.title}
              className="group flex flex-col items-center text-center transition lg:items-start lg:text-left"
            >
              <div className="mb-5 rounded-2xl bg-secondary p-4 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <s.icon className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-foreground">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="mx-auto max-w-7xl px-6 py-28">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-primary">
              Sobre o CAES
            </div>
            <h2 className="text-balance text-4xl font-extrabold uppercase leading-tight text-foreground md:text-5xl">
              Inclusão e cuidado caminham juntos
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              O Centro de Atendimento Especializado em Saúde da APAE de Santa Maria de Jetibá-ES
              é referência regional no cuidado de pessoas com deficiência intelectual e múltipla.
              Reunimos profissionais qualificados em um ambiente acolhedor para promover
              autonomia, dignidade e qualidade de vida.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                { n: "+30", l: "Anos de história" },
                { n: "+800", l: "Vidas atendidas" },
                { n: "15", l: "Especialidades" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-3xl font-extrabold text-primary md:text-4xl">{s.n}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-secondary shadow-[var(--shadow-soft)]">
              <img
                src={heroImage}
                alt="Ambiente acolhedor do CAES"
                className="h-full w-full object-cover"
                loading="lazy"
                width={1920}
                height={1280}
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-accent p-6 text-accent-foreground shadow-[var(--shadow-soft)] md:block">
              <Heart className="mb-2 h-6 w-6" />
              <div className="text-sm font-bold uppercase tracking-wider">Cuidado com amor</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="bg-secondary py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">
              Contato
            </div>
            <h2 className="text-balance text-4xl font-extrabold uppercase text-foreground md:text-5xl">
              Estamos aqui para você
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: MapPin, title: "Endereço", text: "Santa Maria de Jetibá — ES" },
              { icon: Phone, title: "Telefone", text: "(27) 0000-0000" },
              { icon: Mail, title: "E-mail", text: "contato@apaesmj.org.br" },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-2xl bg-card p-8 text-center shadow-[var(--shadow-card)]"
              >
                <div className="mx-auto mb-4 inline-flex rounded-2xl bg-secondary p-4 text-primary">
                  <c.icon className="h-6 w-6" />
                </div>
                <div className="mb-1 text-sm font-bold uppercase tracking-wider text-foreground">
                  {c.title}
                </div>
                <div className="text-muted-foreground">{c.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-10 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-center md:flex-row md:text-left">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.2em] opacity-70">APAE</div>
            <div className="font-bold">CAES — Santa Maria de Jetibá-ES</div>
          </div>
          <div className="text-sm opacity-70">
            © {new Date().getFullYear()} APAE Santa Maria de Jetibá-ES. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
