import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookStatus } from "@prisma/client";
import type { BookSearchFilters } from "@/lib/server/types";

interface BookSearchProps {
  filters: BookSearchFilters;
  onFiltersChange: (filters: BookSearchFilters) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export function BookSearch({ filters, onFiltersChange, onSearch, isLoading }: BookSearchProps) {
  const handleInputChange = (field: keyof BookSearchFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === "all" ? undefined : (value as BookStatus),
    });
  };

  const handleNumberChange = (field: keyof BookSearchFilters, value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    onFiltersChange({
      ...filters,
      [field]: numValue,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Books</CardTitle>
        <CardDescription>Find books by title, author, genre, and more</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Search by title..."
              value={filters.title || ""}
              onChange={(e) => handleInputChange("title", e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              placeholder="Search by author..."
              value={filters.author || ""}
              onChange={(e) => handleInputChange("author", e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              placeholder="Search by genre..."
              value={filters.genre || ""}
              onChange={(e) => handleInputChange("genre", e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN</Label>
            <Input
              id="isbn"
              placeholder="Search by ISBN..."
              value={filters.isbn || ""}
              onChange={(e) => handleInputChange("isbn", e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publisher">Publisher</Label>
            <Input
              id="publisher"
              placeholder="Search by publisher..."
              value={filters.publisher || ""}
              onChange={(e) => handleInputChange("publisher", e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={BookStatus.AVAILABLE}>Available</SelectItem>
                <SelectItem value={BookStatus.CHECKED_OUT}>Checked Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Input
              id="language"
              placeholder="e.g., English"
              value={filters.language || ""}
              onChange={(e) => handleInputChange("language", e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minYear">Min Year</Label>
            <Input
              id="minYear"
              type="number"
              placeholder="e.g., 1900"
              value={filters.minYear || ""}
              onChange={(e) => handleNumberChange("minYear", e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxYear">Max Year</Label>
            <Input
              id="maxYear"
              type="number"
              placeholder="e.g., 2024"
              value={filters.maxYear || ""}
              onChange={(e) => handleNumberChange("maxYear", e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

