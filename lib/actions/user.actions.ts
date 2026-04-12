"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function syncUser() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

  if (!kindeUser || !kindeUser.id) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.id, kindeUser.id),
  });

  if (existing) return existing;

  const newUser = {
    id: kindeUser.id,
    email: kindeUser.email!,
    name: `${kindeUser.given_name || ""} ${kindeUser.family_name || ""}`.trim(),
    picture: kindeUser.picture,
    createdAt: new Date(),
  };

  await db.insert(users).values(newUser);
  return newUser;
}
