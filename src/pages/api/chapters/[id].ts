import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, createMethodAuthHandler } from "@/lib/server";
import type { UpdateChapterInput } from "@/lib/server/types";
import { createChapterNotFoundError, HttpStatusCodes, BookErrorCodes } from "@/lib/server/errors";

// PUT /api/chapters/[id] - Update chapter (requires book:update permission)
// DELETE /api/chapters/[id] - Delete chapter (requires book:update permission)
export default createMethodAuthHandler(
  async (req: NextApiRequest, res: NextApiResponse, { user }): Promise<void> => {
    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "Invalid chapter ID",
      });
    }

    if (req.method === "PUT") {
      // User is guaranteed to be defined due to method config
      if (!user || !user.permissions.includes("book:update")) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          error: "You do not have permission to update chapters",
          code: BookErrorCodes.BOOK_UPDATE_FAILED,
        });
      }

      const chapter = await prisma.chapter.findUnique({
        where: { id },
      });

      if (!chapter) {
        const error = createChapterNotFoundError(id);
        return res.status(error.statusCode).json(error);
      }

      const data: UpdateChapterInput = req.body;

      try {
        const updatedChapter = await prisma.chapter.update({
          where: { id },
          data: {
            ...(data.title && { title: data.title }),
            ...(data.content !== undefined && { content: data.content }),
            ...(data.order !== undefined && { order: data.order }),
          },
        });

        return res.status(HttpStatusCodes.OK).json({ chapter: updatedChapter });
      } catch (error) {
        console.error("Error updating chapter:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to update chapter",
          code: BookErrorCodes.BOOK_UPDATE_FAILED,
        });
      }
    }

    if (req.method === "DELETE") {
      // User is guaranteed to be defined due to method config
      if (!user || !user.permissions.includes("book:update")) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          error: "You do not have permission to delete chapters",
          code: BookErrorCodes.BOOK_UPDATE_FAILED,
        });
      }

      const chapter = await prisma.chapter.findUnique({
        where: { id },
      });

      if (!chapter) {
        const error = createChapterNotFoundError(id);
        return res.status(error.statusCode).json(error);
      }

      try {
        await prisma.chapter.delete({
          where: { id },
        });

        res.status(HttpStatusCodes.NO_CONTENT).end();
        return;
      } catch (error) {
        console.error("Error deleting chapter:", error);
        return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Failed to delete chapter",
          code: BookErrorCodes.BOOK_UPDATE_FAILED,
        });
      }
    }

    return res.status(HttpStatusCodes.METHOD_NOT_ALLOWED).json({
      error: "Method not allowed",
    });
  },
  {
    PUT: { requireAuth: true, requirePermissions: ["book:update"] }, // Auth required for update
    DELETE: { requireAuth: true, requirePermissions: ["book:update"] }, // Auth required for delete
  }
);
