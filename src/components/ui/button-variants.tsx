import * as React from "react";
import { Button, buttonVariants } from "./button";
import { cn } from "@/lib/client/utils";
import type { VariantProps } from "class-variance-authority";

type ButtonProps = React.ComponentProps<typeof Button> & VariantProps<typeof buttonVariants>;

/**
 * CTA Button - Primary call-to-action button
 * Enhanced with explicit dark/light mode support
 */
export function CTAButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/80 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40",
        className
      )}
      {...props}
    />
  );
}

/**
 * Secondary Button - Secondary action button
 * Enhanced with explicit dark/light mode support
 */
export function SecondaryButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="secondary"
      className={cn(
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/70",
        className
      )}
      {...props}
    />
  );
}

/**
 * Link Button - Button styled as a link
 * Enhanced with explicit dark/light mode support
 */
export function LinkButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="link"
      className={cn(
        "text-primary underline-offset-4 hover:underline dark:text-primary dark:hover:text-primary/80",
        className
      )}
      {...props}
    />
  );
}

/**
 * Error Button - Button for destructive actions
 * Enhanced with explicit dark/light mode support
 */
export function ErrorButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="destructive"
      className={cn(
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-destructive dark:text-destructive-foreground dark:hover:bg-destructive/80 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        className
      )}
      {...props}
    />
  );
}

/**
 * Success Button - Button for positive actions
 * Enhanced with explicit dark/light mode support
 */
export function SuccessButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:text-white dark:hover:bg-green-600 focus-visible:ring-green-500/20 dark:focus-visible:ring-green-500/40 transition-colors",
        className
      )}
      {...props}
    />
  );
}

/**
 * Warning Button - Button for warning actions
 * Enhanced with explicit dark/light mode support
 */
export function WarningButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        "bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-500 dark:text-white dark:hover:bg-yellow-600 focus-visible:ring-yellow-500/20 dark:focus-visible:ring-yellow-500/40 transition-colors",
        className
      )}
      {...props}
    />
  );
}

/**
 * Info Button - Button for informational actions
 * Enhanced with explicit dark/light mode support
 */
export function InfoButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-500/40 transition-colors",
        className
      )}
      {...props}
    />
  );
}
