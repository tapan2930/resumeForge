"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user || !user.id) throw new Error("Unauthorized");
  return user.id;
}

export async function getResumesByFolder(folderId: string) {
  const userId = await getUserId();
  return db.query.resumes.findMany({
    where: and(
      eq(resumes.userId, userId),
      eq(resumes.folderId, folderId),
      isNull(resumes.deletedAt)
    ),
    orderBy: [desc(resumes.updatedAt)],
  });
}

export async function getResumeByIdAction(id: string) {
  const userId = await getUserId();
  return db.query.resumes.findFirst({
    where: and(eq(resumes.id, id), eq(resumes.userId, userId)),
  });
}

export async function getRecentResumesAction(limit = 8) {
  const userId = await getUserId();
  return db.query.resumes.findMany({
    where: and(eq(resumes.userId, userId), isNull(resumes.deletedAt)),
    limit,
    orderBy: [desc(resumes.updatedAt)],
  });
}

export async function createResumeAction(data: {
  folderId: string;
  title: string;
  content: any;
  template: string;
  margins?: any;
  linkSettings?: any;
  isTailored?: boolean;
  atsScore?: number | null;
  grammarScore?: number | null;
}) {
  const userId = await getUserId();
  const newResume = {
    ...data,
    atsScore: data.atsScore ?? null,
    grammarScore: data.grammarScore ?? null,
    id: crypto.randomUUID(),
    userId,
    isTailored: data.isTailored ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(resumes).values(newResume);
  revalidatePath("/");
  return newResume;
}

export async function updateResumeAction(id: string, patch: any) {
  const userId = await getUserId();
  await db
    .update(resumes)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
  revalidatePath("/");
}

/** Soft-delete: sets deletedAt instead of removing the row. */
export async function deleteResumeAction(id: string) {
  const userId = await getUserId();
  await db
    .update(resumes)
    .set({ deletedAt: new Date() })
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
  revalidatePath("/");
}

/** Restore a soft-deleted resume by clearing deletedAt. */
export async function restoreResumeAction(id: string) {
  const userId = await getUserId();
  await db
    .update(resumes)
    .set({ deletedAt: null })
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
  revalidatePath("/");
}
