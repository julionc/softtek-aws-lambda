import { Character } from "../entities/Character";

export interface CharacterRepository {
  save(character: Character): Promise<void>;
  findByName(name: string): Promise<Character | null>;
}
