import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock } from "lucide-react";

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
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>
        <div className="rounded-3xl bg-card p-10 shadow-[var(--shadow-soft)]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex rounded-2xl bg-secondary p-4 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold uppercase tracking-tight text-foreground">
              Acesso Profissional
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre com suas credenciais para acessar o sistema.
            </p>
          </div>
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" required />
            </div>
            <Button
              type="submit"
              className="w-full rounded-full bg-primary py-6 text-sm font-bold uppercase tracking-wider hover:bg-primary/90"
            >
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
