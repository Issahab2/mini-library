import type { NextApiRequest, NextApiResponse } from "next";
import { enrichBookData, isAIServiceAvailable } from "@/lib/server";
import { HttpStatusCodes } from "@/lib/server/errors";

// POST /api/books/preview-enrich - Preview AI enrichment for a book (public, but requires title/author)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  }

  const { title, author, description } = req.body;

  if (!title || !author) {
    return res.status(HttpStatusCodes.BAD_REQUEST).json({
      error: "Title and author are required",
    });
  }

  // Check if AI service is available
  if (!isAIServiceAvailable()) {
    return res.status(HttpStatusCodes.SERVICE_UNAVAILABLE).json({
      error: "AI service is not available. Please configure OPENAI_API_KEY.",
    });
  }

  try {
    // Generate AI enrichment
    const aiResult = await enrichBookData(title, author, description);

    if (!aiResult.tags && !aiResult.summary) {
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to generate AI enrichment data",
      });
    }

    // Return preview data
    const previewData: {
      genre?: string;
      tags?: string[];
      summary?: string;
    } = {};

    if (aiResult.tags) {
      if (aiResult.tags.genres.length > 0) {
        previewData.genre = aiResult.tags.genres[0]; // Use first genre
      }
      if (aiResult.tags.tags.length > 0) {
        previewData.tags = aiResult.tags.tags;
      }
    }

    if (aiResult.summary) {
      previewData.summary = aiResult.summary;
    }

    return res.status(HttpStatusCodes.OK).json(previewData);
  } catch (error) {
    console.error("[Preview Enrichment] Error:", error);
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to generate preview enrichment",
    });
  }
}
