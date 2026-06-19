import { prisma } from "@/lib/prisma";

export async function updateChallenges(type: string) {
  const challenges = await prisma.challenge.findMany({
    where: { active: true, goalType: type, endDate: { gte: new Date() } },
  });

  for (const challenge of challenges) {
    await prisma.challenge.update({
      where: { id: challenge.id },
      data: { currentValue: { increment: 1 } },
    });
  }
}