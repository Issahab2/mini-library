import * as React from "react";
import { Button, buttonVariants } from "./button";
import { cn } from "@/lib/client/utils";
import type { VariantProps } from "class-variance-authority";

type ButtonProps = React.ComponentProps<typeof Button> & VariantProps<typeof buttonVariants>;

/**
 * CTA Button - Primary call-to-action button
 * Uses semantic tokens that automatically adapt to dark/light mode
 */
export function CTAButton({ className, ...props }: ButtonProps) {
  return <Button className={cn("bg-primary text-primary-foreground hover:bg-primary/90", className)} {...props} />;
}

/**
 * Secondary Button - Secondary action button
 * Uses semantic tokens that automatically adapt to dark/light mode
 */
export function SecondaryButton({ className, ...props }: ButtonProps) {
  return <Button variant="secondary" className={className} {...props} />;
}

/**
 * Link Button - Button styled as a link
 * Uses semantic tokens that automatically adapt to dark/light mode
 */
export function LinkButton({ className, ...props }: ButtonProps) {
  return <Button variant="link" className={className} {...props} />;
}

/**
 * Error Button - Button for destructive actions
 * Uses semantic tokens that automatically adapt to dark/light mode
 */
export function ErrorButton({ className, ...props }: ButtonProps) {
  return <Button variant="destructive" className={className} {...props} />;
}

/**
 * Success Button - Button for positive actions
 * Uses explicit colors with proper dark/light mode support
 */
export function SuccessButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:text-white dark:hover:bg-green-600 focus-visible:ring-green-500/20 dark:focus-visible:ring-green-500/40",
        className
      )}
      {...props}
    />
  );
}
