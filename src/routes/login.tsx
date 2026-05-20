import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import logoApae from "@/assets/logo-apae.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acesso Profissional — CAES APAE SMJ" },
      { name: "description", content: "Área restrita para profissionais do CAES." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar à página inicial
        </Link>
        <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
          <div className="mb-8 text-center">
            <Link
              to="/"
              aria-label="Página inicial"
              className="mx-auto mb-5 inline-flex items-center justify-center rounded-xl border border-border bg-background p-3"
            >
              <img
                src={logoApae}
                alt="APAE Santa Maria de Jetibá-ES"
                className="h-16 w-auto"
              />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              APAE - ES Santa Maria de Jetibá
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sistema de Cadastro — acesso restrito
            </p>
          </div>
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required />
            </div>
            <Button
              type="submit"
              className="w-full rounded-md bg-primary py-6 text-sm font-semibold hover:bg-primary/90"
            >
              Entrar
            </Button>
            <div className="text-center">
              <a
                href="#"
                className="text-sm font-medium text-primary hover:underline"
              >
                Esqueci minha senha
              </a>
            </div>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Apenas administradores podem criar novas contas. Solicite acesso à coordenação.
          </p>
        </div>
      </div>
    </div>
  );
}
