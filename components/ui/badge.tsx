import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#238636]/20 text-[#39d353] border-[#238636]/50",
        secondary:
          "border-transparent bg-[#21262d] text-[#c9d1d9] border-[#30363d]",
        destructive:
          "border-transparent bg-red-950/40 text-red-400 border-red-800/40",
        outline: "text-[#8b949e] border-[#30363d]",
        commit: "bg-[#161b22] text-[#58a6ff] border-[#388bfd]/30",
        pr: "bg-purple-950/40 text-[#bc8cff] border-[#a371f7]/40",
        push: "bg-emerald-950/40 text-[#39d353] border-[#238636]/40",
        repo: "bg-amber-950/40 text-amber-300 border-amber-800/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
