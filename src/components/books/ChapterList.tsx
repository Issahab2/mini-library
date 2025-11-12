import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Chapter } from "@prisma/client";

interface ChapterListProps {
  chapters: Chapter[];
  isLoading?: boolean;
}

export function ChapterList({ chapters, isLoading }: ChapterListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No chapters available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Chapters ({chapters.length})</h3>
      {chapters.map((chapter) => (
        <Card key={chapter.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{chapter.title}</CardTitle>
              <Badge variant="outline">Chapter {chapter.order}</Badge>
            </div>
          </CardHeader>
          {chapter.content && (
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">{chapter.content}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

