
import { Information } from "../entities/Information";
import { InformationRepository } from "../ports/InformationRepository";

export class SaveInformation {
  constructor(private readonly repository: InformationRepository) {
  }
  
  async execute(data: string): Promise<Information> {
    const id = `ID-${Date.now()}`;
    data = JSON.stringify(data);
    const information = new Information(id, data);
    await this.repository.save(information);
    return information;
  }
}
