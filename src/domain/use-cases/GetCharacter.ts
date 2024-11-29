import { Character } from "../entities/Character";
import { CharacterRepository } from "../ports/CharacterRepository";
export class GetCharacter {
  constructor(
    private readonly characterRepository: CharacterRepository
  ) { }

  async execute(name: string): Promise<Character | null> {
    return await this.characterRepository.findByName(name);
  }

  async getPaginateData(
    limit: number,
    lastEvaluatedKey?: string | null
  ): Promise<{
    count: number;
    next: string | null;
    results: Character[];
  }> {
    return await this.characterRepository.getAllPaginated(
      limit,
      lastEvaluatedKey
    );
  }
}
