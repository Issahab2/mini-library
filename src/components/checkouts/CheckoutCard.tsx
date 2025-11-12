import { Badge } from "@/components/ui/badge";
import { CTAButton } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { CheckoutWithRelations } from "@/lib/server/types";
import { format } from "date-fns";
import { OverdueBadge } from "./OverdueBadge";

interface CheckoutCardProps {
  checkout: CheckoutWithRelations;
  onReturn?: (checkoutId: string) => void;
  showActions?: boolean;
  canReturn?: boolean;
}

export function CheckoutCard({ checkout, onReturn, showActions = true, canReturn = true }: CheckoutCardProps) {
  const isReturned = !!checkout.returnedDate;
  const isOverdue = checkout.isOverdue && !isReturned;
  const lateFeeAmount = checkout.lateFeeAmount ? Number(checkout.lateFeeAmount) : null;

  // Guard against missing book data
  if (!checkout.book) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Book information unavailable</CardTitle>
          <CardDescription>This checkout references a book that may have been deleted</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={isOverdue ? "border-destructive dark:border-destructive/80" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{checkout.book.title}</CardTitle>
            <CardDescription>by {checkout.book.author}</CardDescription>
          </div>
          {isOverdue && (
            <OverdueBadge isOverdue={true} overdueDays={checkout.overdueDays} lateFeeAmount={lateFeeAmount} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm">
          <p>
            <span className="font-medium">Checked out:</span> {format(new Date(checkout.checkoutDate), "MMM dd, yyyy")}
          </p>
          <p>
            <span className="font-medium">Due date:</span> {format(new Date(checkout.dueDate), "MMM dd, yyyy")}
          </p>
          {isReturned && checkout.returnedDate && (
            <p>
              <span className="font-medium">Returned:</span> {format(new Date(checkout.returnedDate), "MMM dd, yyyy")}
            </p>
          )}
          {lateFeeAmount && lateFeeAmount > 0 && (
            <p className="text-destructive">
              <span className="font-medium">Late fee:</span> ${lateFeeAmount.toFixed(2)}
            </p>
          )}
        </div>
        {!isReturned && (
          <div className="flex gap-2">
            <Badge variant={isOverdue ? "destructive" : "secondary"}>{isOverdue ? "Overdue" : "Active"}</Badge>
          </div>
        )}
        {isReturned && <Badge variant="outline">Returned</Badge>}
      </CardContent>
      {showActions && !isReturned && onReturn && canReturn && (
        <CardFooter>
          <CTAButton onClick={() => onReturn(checkout.id)} className="w-full">
            Return Book
          </CTAButton>
        </CardFooter>
      )}
    </Card>
  );
}
