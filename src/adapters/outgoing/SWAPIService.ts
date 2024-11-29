import axios from "axios";
import { Character } from "../../domain/entities/Character";
import { v4 as uuidv4 } from 'uuid';
export class SWAPIService {
  private baseUrl = "https://swapi.dev/api/people";

  async getFirstCharacterBySearch(name: string): Promise<Character | null> {
    const response = await axios.get(this.baseUrl, {
      params: { search: name },
    });

    const data = response.data;
    if (data.count == 0) {
      return null;
    }

    const result = response.data.results[0];

    return {
      id: uuidv4(),
      name: result.name,
      height: result.height,
      mass: result.mass,
      hairColor: result.hair_color,
      skinColor: result.skin_color,
      eyeColor: result.eye_color,
      birthYear: result.birth_year,
      gender: result.gender,
      homeworld: result.homeworld,
    };
  }
}
