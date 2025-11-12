-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "genre" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "publicationYear" INTEGER,
ADD COLUMN     "publisher" TEXT,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "Checkout" ADD COLUMN     "isOverdue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lateFeeAmount" DECIMAL(10,2),
ADD COLUMN     "lateFeePerDay" DECIMAL(10,2) NOT NULL DEFAULT 0.50,
ADD COLUMN     "maxDurationDays" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "overdueDays" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "maxCheckoutLimit" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "order" INTEGER NOT NULL,
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chapter_bookId_idx" ON "Chapter"("bookId");

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
