"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { folders, resumes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user || !user.id) throw new Error("Unauthorized");
  return user.id;
}

export async function getFolders() {
  const userId = await getUserId();
  return db.query.folders.findMany({
    where: eq(folders.userId, userId),
    orderBy: (folders, { desc }) => [desc(folders.updatedAt)],
  });
}

export async function createFolder(name: string, color: string) {
  const userId = await getUserId();
  const newFolder = {
    id: crypto.randomUUID(),
    userId,
    name,
    color,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(folders).values(newFolder);
  revalidatePath("/");
  return newFolder;
}

export async function updateFolderAction(id: string, patch: { name?: string; color?: string }) {
  const userId = await getUserId();
  await db
    .update(folders)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(folders.id, id), eq(folders.userId, userId)));
  revalidatePath("/");
}

export async function deleteFolderAction(id: string) {
  const userId = await getUserId();
  // Delete all resumes in this folder first (FK constraint)
  await db
    .delete(resumes)
    .where(and(eq(resumes.folderId, id), eq(resumes.userId, userId)));
  await db
    .delete(folders)
    .where(and(eq(folders.id, id), eq(folders.userId, userId)));
  revalidatePath("/");
}
