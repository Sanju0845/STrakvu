import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#238636] text-white hover:bg-[#2ea043] shadow-sm active:translate-y-px",
        destructive:
          "bg-red-900/60 text-red-200 border border-red-800/80 hover:bg-red-800/60",
        outline:
          "border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] hover:text-white",
        secondary:
          "bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-white",
        ghost: "hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]",
        link: "text-[#58a6ff] underline-offset-4 hover:underline",
        github: "bg-[#24292f] text-white hover:bg-[#2f363d] border border-[#30363d] shadow-sm",
        emeraldGhost: "bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
