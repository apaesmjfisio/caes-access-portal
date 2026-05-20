import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, MapPin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-caes.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CAES — APAE Santa Maria de Jetibá-ES" },
      {
        name: "description",
        content:
          "Centro de Atendimento Especializado em Saúde — APAE Santa Maria de Jetibá-ES. Acolhimento, reabilitação e cuidado humanizado.",
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
  { label: "Início", href: "#inicio", to: null as string | null },
  { label: "Serviços", href: null, to: "/servicos" },
  { label: "Sobre", href: "#sobre", to: null },
  { label: "Contato", href: "#contato", to: null },
  { label: "Triagem", href: null, to: "/triagem" },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero with header */}
      <section
        id="inicio"
        className="relative min-h-[100vh] w-full overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.55)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Header */}
        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="text-foreground">
            <div className="text-xs font-medium uppercase tracking-[0.2em] opacity-80">APAE</div>
            <div className="text-lg font-bold leading-tight">CAES</div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((n) =>
              n.to ? (
                <Link
                  key={n.label}
                  to={n.to}
                  className="text-sm font-semibold uppercase tracking-wider text-foreground/80 transition hover:text-primary"
                >
                  {n.label}
                </Link>
              ) : (
                <a
                  key={n.label}
                  href={n.href!}
                  className="text-sm font-semibold uppercase tracking-wider text-foreground/80 transition hover:text-primary"
                >
                  {n.label}
                </a>
              ),
            )}
          </nav>

          <Link to="/login">
            <Button
              size="lg"
              className="rounded-full bg-primary px-6 font-bold uppercase tracking-wider text-primary-foreground shadow-[var(--shadow-soft)] hover:bg-primary/90"
            >
              Acesso Profissional
            </Button>
          </Link>
        </header>

        {/* Hero content */}
        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Centro de Atendimento Especializado em Saúde
          </div>
          <h1 className="text-balance text-6xl font-extrabold uppercase tracking-tight text-foreground sm:text-7xl md:text-8xl">
            CAES
          </h1>
          <div className="mt-4 text-base font-semibold uppercase tracking-[0.2em] text-foreground/80 sm:text-lg">
            APAE — Santa Maria de Jetibá-ES
          </div>
          <p className="mt-8 max-w-2xl text-balance text-lg leading-relaxed text-foreground/80 sm:text-xl">
            Acolhimento, reabilitação e cuidado humanizado para pessoas com deficiência e suas
            famílias.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-primary px-8 py-6 text-base font-bold uppercase tracking-wider shadow-[var(--shadow-soft)] hover:bg-primary/90"
            >
              <Link to="/login">Acesso Profissional</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-2 border-foreground/30 bg-background/70 px-8 py-6 text-base font-bold uppercase tracking-wider text-foreground backdrop-blur hover:bg-foreground hover:text-background"
            >
              <Link to="/triagem">Saiba Mais</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="mx-auto max-w-7xl px-6 py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Sobre o CAES
          </div>
          <h2 className="text-balance text-4xl font-extrabold uppercase leading-tight text-foreground md:text-5xl">
            Inclusão e cuidado caminham juntos
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            O Centro de Atendimento Especializado em Saúde da APAE de Santa Maria de Jetibá-ES é
            referência regional no cuidado de pessoas com deficiência intelectual e múltipla.
            Reunimos profissionais qualificados em um ambiente acolhedor para promover autonomia,
            dignidade e qualidade de vida.
          </p>
        </div>
      </section>

      {/* Contato section anchor */}
      <section id="contato" />

      {/* Footer */}
      <Footer />
    </div>
  );
}

function Footer() {
  const mapsEmbed =
    "https://www.google.com/maps?q=Rua%20Henrique%20Jo%C3%A3o%20J%C3%BAlio%20K%C3%BCster%2C%20469%2C%20S%C3%A3o%20Luiz%2C%20Santa%20Maria%20de%20Jetib%C3%A1%20-%20ES%2C%2029645-234&output=embed";

  return (
    <footer className="bg-[oklch(0.22_0.04_240)] py-14 text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                APAE
              </div>
              <div>
                <div className="text-lg font-extrabold leading-tight">CAES</div>
                <div className="text-xs opacity-70">APAE — Santa Maria de Jetibá-ES</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed opacity-75">
              Centro de Atendimento Especializado em Saúde, comprometido com o cuidado humanizado.
            </p>
          </div>

          {/* Contato */}
          <div>
            <div className="mb-4 text-sm font-bold uppercase tracking-[0.2em]">Contato</div>
            <ul className="space-y-3 text-sm opacity-90">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Rua Henrique João Júlio Küster, nº 469, São Luiz, Santa Maria de Jetibá, CEP
                  29.645-234
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href="tel:+5527997879964" className="hover:text-primary">
                  (27) 99787-9964
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:apaesmjcaes@gmail.com" className="hover:text-primary">
                  apaesmjcaes@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Localização */}
          <div>
            <div className="mb-4 text-sm font-bold uppercase tracking-[0.2em]">Localização</div>
            <a
              href="https://www.google.com/maps/place/Oficina/@-20.0032673,-40.737392,19z"
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-xl border border-white/10 transition hover:border-primary"
            >
              <iframe
                title="Mapa CAES APAE Santa Maria de Jetibá-ES"
                src={mapsEmbed}
                className="h-40 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </a>
          </div>

          {/* Links */}
          <div>
            <div className="mb-4 text-sm font-bold uppercase tracking-[0.2em]">Links</div>
            <ul className="space-y-2 text-sm opacity-90">
              <li>
                <a href="/#inicio" className="hover:text-primary">
                  Início
                </a>
              </li>
              <li>
                <Link to="/servicos" className="hover:text-primary">
                  Serviços
                </Link>
              </li>
              <li>
                <a href="/#sobre" className="hover:text-primary">
                  Sobre
                </a>
              </li>
              <li>
                <a href="/#contato" className="hover:text-primary">
                  Contato
                </a>
              </li>
              <li>
                <Link to="/triagem" className="hover:text-primary">
                  Triagem
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary">
                  Acesso Profissional
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs opacity-60">
          © {new Date().getFullYear()} APAE — Santa Maria de Jetibá-ES · Todos os direitos
          reservados.
        </div>
      </div>
    </footer>
  );
}
