import OpenAI from "openai";
import { OPENAI_API_KEY } from "./constants/env";

// Initialize OpenAI client only if API key is available
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/**
 * Checks if AI service is available
 */
export function isAIServiceAvailable(): boolean {
  return openai !== null;
}

/**
 * Logs a warning if AI service is not available
 */
function logAIServiceUnavailable(): void {
  if (!isAIServiceAvailable()) {
    console.warn(
      "[AI Service] OPENAI_API_KEY not configured. AI service is disabled. Book tagging and summarization will not be available."
    );
  }
}

export interface BookTagsResult {
  genres: string[];
  tags: string[];
}

/**
 * Generate book tags (genres and keywords) using AI
 * @param title - Book title
 * @param author - Book author
 * @param description - Optional book description
 * @returns Object with genres array (3 items) and tags array (5-10 items), or null if unavailable/error
 */
export async function generateBookTags(
  title: string,
  author: string,
  description?: string
): Promise<BookTagsResult | null> {
  if (!isAIServiceAvailable()) {
    logAIServiceUnavailable();
    return null;
  }

  try {
    const prompt = `Given the book "${title}" by ${author}${description ? ` with the following description: ${description}` : ""}, generate:
1. Exactly 3 appropriate genres (e.g., "Science Fiction", "Mystery", "Romance")
2. 5-10 relevant keywords/tags (e.g., "space", "adventure", "friendship", "technology")

Return your response as a JSON object with this exact structure:
{
  "genres": ["genre1", "genre2", "genre3"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Only return the JSON object, no additional text.`;

    const response = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates book metadata. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("[AI Service] No content in OpenAI response");
      return null;
    }

    // Parse JSON response
    const parsed = JSON.parse(content.trim());

    // Validate structure
    if (!parsed.genres || !Array.isArray(parsed.genres) || parsed.genres.length !== 3) {
      console.error("[AI Service] Invalid genres in response");
      return null;
    }

    if (!parsed.tags || !Array.isArray(parsed.tags) || parsed.tags.length < 5 || parsed.tags.length > 10) {
      console.error("[AI Service] Invalid tags in response");
      return null;
    }

    return {
      genres: parsed.genres,
      tags: parsed.tags,
    };
  } catch (error) {
    console.error("[AI Service] Error generating book tags:", error);
    // Return null to not block application flow
    return null;
  }
}

/**
 * Generate a 100-word summary for a book using AI
 * @param title - Book title
 * @param author - Book author
 * @param description - Optional book description
 * @returns Summary string (approximately 100 words), or null if unavailable/error
 */
export async function generateBookSummary(title: string, author: string, description?: string): Promise<string | null> {
  if (!isAIServiceAvailable()) {
    logAIServiceUnavailable();
    return null;
  }

  try {
    const prompt = `Write a concise 100-word summary for a library catalog for the book "${title}" by ${author}${description ? `. Here is the book's description: ${description}` : ""}. 

The summary should be engaging, informative, and suitable for a library catalog. It should be approximately 100 words.`;

    const response = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that writes book summaries for library catalogs. Write clear, engaging summaries that are approximately 100 words.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const summary = response.choices[0]?.message?.content;
    if (!summary) {
      console.error("[AI Service] No summary in OpenAI response");
      return null;
    }

    return summary.trim();
  } catch (error) {
    console.error("[AI Service] Error generating book summary:", error);
    // Return null to not block application flow
    return null;
  }
}

/**
 * Generate both tags and summary for a book
 * @param title - Book title
 * @param author - Book author
 * @param description - Optional book description
 * @returns Object with tags result and summary, or null if unavailable/error
 */
export async function enrichBookData(
  title: string,
  author: string,
  description?: string
): Promise<{ tags: BookTagsResult | null; summary: string | null }> {
  if (!isAIServiceAvailable()) {
    logAIServiceUnavailable();
    return { tags: null, summary: null };
  }

  // Run both in parallel for better performance
  const [tags, summary] = await Promise.all([
    generateBookTags(title, author, description),
    generateBookSummary(title, author, description),
  ]);

  return { tags, summary };
}
