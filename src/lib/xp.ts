import { prisma } from "@/lib/prisma";

export async function addXp(userId: string, amount: number) {
  // Incrémente XP
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
    select: { xp: true, level: true },
  });

  // Vérifier si passage de niveau (par exemple, 1000 XP par niveau)
  const newLevel = Math.floor(user.xp / 1000) + 1;
  if (newLevel > user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
    // Optionnel : notification de montée de niveau
  }
}
