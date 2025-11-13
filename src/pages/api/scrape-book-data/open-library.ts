import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/server/prisma";
import { IS_DEVELOPMENT } from "@/lib/server/constants/env";

const OPENLIBRARY_URL = "https://openlibrary.org/api/books";

const ISBNS = [
  "978-1-60309-502-0",
  "978-1-60309-517-4",
  "978-1-60309-442-9",
  "978-1-60309-542-6",
  "978-1-60309-563-1",
  "978-1-60309-527-3",
  "978-1-60309-535-8",
  "978-1-60309-520-4",
  "978-1-60309-454-2",
  "978-1-60309-511-2",
  "978-1-60309-540-2",
  "978-1-60309-492-4",
  "978-1-60309-513-6",
  "978-1-60309-514-3",
  "978-1-60309-546-4",
  "978-1-60309-508-2",
  "978-1-60309-038-4",
  "978-1-60309-515-0",
  "978-1-60309-505-1",
  "UPC 827714016215 00311",
  "UPC 827714016215 00511",
  "UPC 827714016215 00711",
  "UPC 827714016215 00811",
  "UPC 827714016215 00911",
  "UPC 827714016215 01011",
  "978-1-60309-469-6",
  "978-1-60309-526-6",
  "978-1-60309-504-4",
  "978-1-60309-521-1",
  "978-1-60309-030-8",
  "978-1-60309-412-2",
  "978-1-60309-537-2",
  "978-1-60309-534-1",
  "978-1-891830-91-4",
  "978-1-60309-067-4",
  "978-1-60309-558-7",
  "978-1-60309-574-7",
  "978-1-60309-575-4",
  "978-1-60309-541-9",
  "978-1-60309-015-5",
  "978-1-60309-041-4",
  "978-1-60309-084-1",
  "9781603093491",
  "978-1-60309-384-2",
  "978-1-60309-503-7",
  "978-1-60309-533-4",
  "9781603093682",
  "978-1-60309-500-6",
  "978-1-60309-554-9",
  "978-1-60309-467-2",
  "978-1-60309-538-9",
  "978-1-60309-555-6",
  "978-1-60309-329-3",
  "978-1-60309-496-2",
  "978-1-60309-456-6",
  "978-1-60309-528-0",
  "978-1-60309-436-8",
  "978-1-60309-557-0",
  "978-1-60309-506-8",
  "978-1-60309-552-5",
  "978-1-60309-395-8",
  "978-1-60309-300-2",
  "978-1-60309-400-9",
  "978-1-60309-402-3",
  "978-1-60309-536-5",
  "978-1-60309-491-7",
  "978-1-60309-550-1",
  "978-1-60309-560-0",
  "978-1-60309-274-6",
  "978-1-60309-355-2",
  "978-1-60309-320-0",
  "978-1-60309-489-4",
  "978-1-60309-510-5",
  "978-1-60309-562-4",
  "978-1-60309-481-8",
  "978-1-60309-564-8",
  "978-1-60309-512-9",
  "978-1-60309-501-3",
  "978-1-60309-413-9",
  "978-1-60309-490-0",
  "978-1-60309-531-0",
  "978-1-60309-524-2",
  "978-1-60309-499-3",
  "978-1-60309-548-8",
  "978-1-60309-522-8",
  "978-1-60309-547-1",
  "978-1-60309-519-8",
  "978-1-60309-543-3",
  "978-1-60309-561-7",
  "978-1-60309-516-7",
  "978-1-60309-411-5",
  "978-1-60309-447-4",
  "978-1-60309-494-8",
  "978-1-60309-529-7",
  "978-1-60309-045-2",
  "978-1-60309-258-6",
  "978-1-60309-450-4",
  "978-1-60309-470-2",
  "978-1-60309-544-0",
  "978-1-60309-392-7",
  "978-1-60309-074-2",
  "978-1-60309-523-5",
  "978-1-60309-545-7",
  "978-1-60309-035-3",
  "978-1-60309-507-5",
  "978-1-60309-549-5",
  "978-1-60309-530-3",
  "978-1-60309-539-6",
  "978-1-60309-532-7",
  "978-1-60309-553-2",
  "978-1-60309-570-9",
  "978-1-60309-568-6",
  "978-1-60309-582-2",
  "978-1-60309-587-7",
  "978-1-60309-584-6",
  "978-1-60309-580-8",
  "978-1-60309-572-3",
  "978-1-60309-586-0",
  "978-1-60309-581-5",
  "978-1-60309-569-3",
  "978-1-60309-585-3",
  "978-1-60309-579-2",
  "978-1-60309-518-1",
  "978-1-60309-567-9",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const get = (obj: any, path: string[], defaultValue: any): any => {
  let result = obj;
  for (const key of path) {
    if (result === undefined || result === null) return defaultValue;
    result = result[key];
  }
  return result === undefined ? defaultValue : result;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!IS_DEVELOPMENT) {
    return res.status(403).json({
      error: "Forbidden",
      message: "This endpoint is only available in development mode.",
    });
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const bibkeys = ISBNS.map((isbn) => `ISBN:${isbn}`).join(",");
  const fetchUrl = `${OPENLIBRARY_URL}?bibkeys=${bibkeys}&jscmd=data&format=json`;

  try {
    console.log(`📚 Fetching data for ${ISBNS.length} ISBNs...`);
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`OpenLibrary API failed: ${response.statusText}`);
    }

    const data = await response.json();
    let booksProcessed = 0;

    for (const isbn of ISBNS) {
      const key = `ISBN:${isbn}`;
      const bookData = data[key];

      if (!bookData) {
        console.warn(`No data found for ISBN: ${isbn}`);
        continue;
      }

      const authorValue: unknown = get(bookData, ["authors", "0", "name"], "Unknown Author");
      const publisherValue: unknown = get(bookData, ["publishers", "0", "name"], "Unknown");
      const genreValue: unknown = get(bookData, ["subjects", "0", "name"], "Uncategorized");
      const languageKey: unknown = get(bookData, ["languages", "0", "key"], "/languages/eng");

      const mappedData = {
        title: String(bookData.title || "Untitled"),
        author: String(authorValue),
        isbn: isbn,
        description: String(get(bookData, ["notes"], "No description available.")),
        summary: String(get(bookData, ["notes"], "No summary available.")).substring(0, 500),
        publisher: String(publisherValue),
        publicationYear: (() => {
          const dateValue: unknown = get(bookData, ["publish_date"], "0");
          const year = parseInt(String(dateValue), 10);
          return isNaN(year) ? null : year;
        })(),
        genre: String(genreValue),
        pageCount: (() => {
          const pagesValue: unknown = get(bookData, ["number_of_pages"], 0);
          const pages = Number(pagesValue);
          return isNaN(pages) ? null : pages;
        })(),
        language: String(String(languageKey).split("/").pop() || "eng"),
        coverImageUrl: get(bookData, ["cover", "large"], null) as string | null,
      };

      await prisma.book.upsert({
        where: { isbn: mappedData.isbn },
        update: mappedData,
        create: mappedData,
      });

      booksProcessed++;
    }

    console.log(`✅ Data scrape completed: ${booksProcessed} books added/updated.`);
    return res.status(200).json({
      success: true,
      message: "Book data scrape completed!",
      booksProcessed: booksProcessed,
    });
  } catch (e) {
    const error = e as Error;
    console.error("❌ Data scrape failed:", error);
    return res.status(500).json({
      success: false,
      error: "Scrape failed",
      message: error.message,
    });
  }
}
