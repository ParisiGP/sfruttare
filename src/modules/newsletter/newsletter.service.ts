import { NewsletterRepository } from "./newsletter.repository";
import { newsletterInscricaoSchema } from "./newsletter.schema";

export class NewsletterService {
  constructor(
    private newsletterRepository =
      new NewsletterRepository()
  ) { }

  async inscrever(email: string) {
    const dadosValidados =
      newsletterInscricaoSchema.parse({ email });

    await this.newsletterRepository.upsertByEmail(
      dadosValidados.email
    );
  }
}
