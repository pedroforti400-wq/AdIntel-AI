"use client";

import { useLayoutEffect } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export const THEME_STORAGE_KEY = "adintel-tema";

/**
 * Script executado antes da página aparecer, para aplicar o tema salvo
 * sem "piscar" a tela. Se não houver tema salvo, segue o tema do sistema.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`;

function readTheme(): "light" | "dark" {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  // Em desenvolvimento o React pode limpar a classe do <html>; reaplicamos aqui.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", readTheme() === "dark");
  }, []);

  function toggle() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema claro/escuro">
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  );
}
