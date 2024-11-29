import { Character } from "../entities/Character";
import { CharacterRepository } from "../ports/CharacterRepository";

export class SaveCharacter {
  constructor(private readonly characterRepository: CharacterRepository) {}

  async execute(character: Character): Promise<void> {
    await this.characterRepository.save(character);
  }
}
