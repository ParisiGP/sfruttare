import { prisma } from "@/lib/prisma";

export class NewsletterRepository {
  async upsertByEmail(email: string) {
    return prisma.newsletterInscricao.upsert({
      where: {
        email,
      },
      create: {
        email,
      },
      update: {},
    });
  }
}
