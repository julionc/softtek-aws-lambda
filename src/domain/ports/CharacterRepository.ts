import { Character } from "../entities/Character";

export interface CharacterRepository {
  save(character: Character): Promise<void>;
  findByName(name: string): Promise<Character | null>;
  getAllPaginated(
    limit: number,
    lastEvaluatedKey?: string | null
  ): Promise<{
    count: number;
    next: string | null;
    results: Character[];
  }>;
}
