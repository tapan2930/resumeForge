"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { customTemplates } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user || !user.id) throw new Error("Unauthorized");
  return user.id;
}

export async function getCustomTemplatesAction() {
  const userId = await getUserId();
  return db.query.customTemplates.findMany({
    where: eq(customTemplates.userId, userId),
    orderBy: [desc(customTemplates.updatedAt)],
  });
}

export async function getCustomTemplateByIdAction(id: string) {
  const userId = await getUserId();
  return db.query.customTemplates.findFirst({
    where: and(eq(customTemplates.id, id), eq(customTemplates.userId, userId)),
  });
}

export async function createCustomTemplateAction(name: string, nodes: any) {
  const userId = await getUserId();
  const newTemplate = {
    id: crypto.randomUUID(),
    userId,
    name,
    nodes,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(customTemplates).values(newTemplate);
  revalidatePath("/templates");
  return newTemplate;
}

export async function updateCustomTemplateAction(id: string, patch: any) {
  const userId = await getUserId();
  await db
    .update(customTemplates)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(customTemplates.id, id), eq(customTemplates.userId, userId)));
  revalidatePath("/templates");
}

export async function deleteCustomTemplateAction(id: string) {
  const userId = await getUserId();
  await db
    .delete(customTemplates)
    .where(and(eq(customTemplates.id, id), eq(customTemplates.userId, userId)));
  revalidatePath("/templates");
}
