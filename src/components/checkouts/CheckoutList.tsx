import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OverdueBadge } from "./OverdueBadge";
import { CTAButton } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";
import type { CheckoutWithRelations } from "@/lib/server/types";
import { format } from "date-fns";

interface CheckoutListProps {
  checkouts: CheckoutWithRelations[];
  onReturn?: (checkoutId: string) => void;
  isLoading?: boolean;
  showUser?: boolean;
  canReturn?: boolean;
  returningCheckoutId?: string | null;
}

export function CheckoutList({
  checkouts,
  onReturn,
  isLoading = false,
  showUser = false,
  canReturn = true,
  returningCheckoutId = null,
}: CheckoutListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (checkouts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No checkouts found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Book</TableHead>
            {showUser && <TableHead>User</TableHead>}
            <TableHead>Checkout Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            {onReturn && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkouts.map((checkout) => {
            const isReturned = !!checkout.returnedDate;
            const isOverdue = checkout.isOverdue && !isReturned;

            return (
              <TableRow key={checkout.id} className={isOverdue ? "bg-destructive/10 dark:bg-destructive/20" : ""}>
                <TableCell>
                  <div>
                    <div className="font-medium">{checkout.book.title}</div>
                    <div className="text-sm text-muted-foreground">by {checkout.book.author}</div>
                  </div>
                </TableCell>
                {showUser && (
                  <TableCell>
                    <div>
                      <div className="font-medium">{checkout.user.name || "Unknown"}</div>
                      <div className="text-sm text-muted-foreground">{checkout.user.email}</div>
                    </div>
                  </TableCell>
                )}
                <TableCell>{format(new Date(checkout.checkoutDate), "MMM dd, yyyy")}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {format(new Date(checkout.dueDate), "MMM dd, yyyy")}
                    {isOverdue && (
                      <OverdueBadge
                        isOverdue={true}
                        overdueDays={checkout.overdueDays}
                        lateFeeAmount={checkout.lateFeeAmount ? Number(checkout.lateFeeAmount) : null}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {isReturned ? (
                    <Badge variant="outline">Returned</Badge>
                  ) : isOverdue ? (
                    <Badge variant="destructive">Overdue</Badge>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </TableCell>
                {onReturn && (
                  <TableCell>
                    {!isReturned && canReturn && (
                      <CTAButton
                        size="sm"
                        onClick={() => onReturn(checkout.id)}
                        disabled={returningCheckoutId === checkout.id}
                      >
                        {returningCheckoutId === checkout.id ? "Returning..." : "Return"}
                      </CTAButton>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
