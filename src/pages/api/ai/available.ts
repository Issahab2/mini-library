import type { NextApiRequest, NextApiResponse } from "next";
import { isAIServiceAvailable } from "@/lib/server";

// GET /api/ai/available - Check if AI service is available (public)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({ available: isAIServiceAvailable() });
}
