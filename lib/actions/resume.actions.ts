"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
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
    where: and(eq(resumes.userId, userId), eq(resumes.folderId, folderId)),
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
    where: eq(resumes.userId, userId),
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
}) {
  const userId = await getUserId();
  const newResume = {
    ...data,
    id: crypto.randomUUID(),
    userId,
    isTailored: false,
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

export async function deleteResumeAction(id: string) {
  const userId = await getUserId();
  await db
    .delete(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
  revalidatePath("/");
}
