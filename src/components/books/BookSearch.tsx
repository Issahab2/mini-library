import * as React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BookStatus } from "@prisma/client";
import type { BookSearchFilters } from "@/lib/server/types";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/client/utils";

interface BookSearchProps {
  filters: BookSearchFilters;
  onFiltersChange: (filters: BookSearchFilters) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export function BookSearch({ filters, onFiltersChange, onSearch, isLoading }: BookSearchProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof BookSearchFilters];
    return value !== undefined && value !== null && value !== "";
  });

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
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

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const handleSearchClick = () => {
    onSearch();
    setIsOpen(false);
  };

  return (
    <>
      {/* Search Button */}
      <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
        <Filter className="size-4" />
        <span>Search & Filter</span>
        {hasActiveFilters && (
          <span className="ml-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">
            {Object.keys(filters).filter((k) => filters[k as keyof BookSearchFilters]).length}
          </span>
        )}
      </Button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-background border-l shadow-lg transition-transform duration-300 ease-in-out overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-lg font-semibold">Search & Filter</h2>
              <p className="text-sm text-muted-foreground">Find books by title, author, genre, and more</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
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
              <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
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

          {/* Sidebar Footer */}
          <div className="p-6 border-t space-y-2">
            <Button onClick={handleSearchClick} disabled={isLoading} className="w-full">
              <Search className="size-4 mr-2" />
              {isLoading ? "Searching..." : "Search"}
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters} className="w-full">
                <X className="size-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
