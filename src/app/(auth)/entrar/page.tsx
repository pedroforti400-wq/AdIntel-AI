import type { Metadata } from "next";
import Link from "next/link";

import { BRAND } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  const BrandIcon = BRAND.icone;

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-b from-accent/60 to-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <BrandIcon className="size-5" />
          </div>
          <span className="text-lg font-semibold">{BRAND.nome}</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              O login ainda não está ativo. Ele será habilitado na Fase 4, junto com o banco de dados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">E-mail</label>
                <Input id="email" type="email" placeholder="voce@empresa.com.br" disabled />
              </div>
              <div className="space-y-2">
                <label htmlFor="senha" className="text-sm font-medium">Senha</label>
                <Input id="senha" type="password" disabled />
              </div>
              <Button type="button" className="w-full" disabled>
                Entrar (disponível na Fase 4)
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/painel" className="font-medium text-primary underline-offset-4 hover:underline">
            Voltar ao painel de demonstração
          </Link>
        </p>
      </div>
    </div>
  );
}
