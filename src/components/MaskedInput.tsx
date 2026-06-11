import * as React from "react";
import { Input } from "@/components/ui/input";
import { onlyDigits } from "@/lib/masks";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  /** Valor armazenado: SOMENTE dígitos. */
  value: string;
  /** Recebe SOMENTE os dígitos. */
  onChange: (rawDigits: string) => void;
  /** Função de formatação a partir de dígitos. */
  format: (digits: string) => string;
  /** Limite de dígitos (após a aplicação da máscara). */
  maxDigits?: number;
  /** Indicador visual de validade (true/false). */
  valid?: boolean | null;
  /** Mensagem abaixo do campo (geralmente erro). */
  hint?: string;
  /** onBlur recebendo os dígitos. */
  onBlurDigits?: (digits: string) => void;
};

export const MaskedInput = React.forwardRef<HTMLInputElement, Props>(function MaskedInput(
  { value, onChange, format, maxDigits, valid, hint, onBlurDigits, className, ...rest }, ref,
) {
  const digits = onlyDigits(value || "");
  const display = format(digits);

  return (
    <div className="space-y-1">
      <Input
        ref={ref}
        inputMode="numeric"
        value={display}
        onChange={(e) => {
          let d = onlyDigits(e.target.value);
          if (maxDigits) d = d.slice(0, maxDigits);
          onChange(d);
        }}
        onBlur={(e) => {
          onBlurDigits?.(onlyDigits(e.target.value));
          rest.onBlur?.(e);
        }}
        className={cn(
          valid === true && "border-emerald-400 focus-visible:ring-emerald-300",
          valid === false && "border-rose-400 focus-visible:ring-rose-300",
          className,
        )}
        {...rest}
      />
      {hint && (
        <p className={cn("text-[0.7rem]", valid === false ? "text-rose-600" : "text-slate-500")}>
          {hint}
        </p>
      )}
    </div>
  );
});
