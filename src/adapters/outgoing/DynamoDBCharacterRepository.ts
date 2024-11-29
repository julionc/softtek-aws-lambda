import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { Character } from "../../domain/entities/Character";
import { CharacterRepository } from "../../domain/ports/CharacterRepository";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export class DynamoDBCharacterRepository implements CharacterRepository {
  private tableName = process.env.CHARACTER_TABLE!;
  private client = new DynamoDBClient({ region: process.env.AWS_DEFAULT_REGION });

  async save(character: Character): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: {
        id: { S: character.id },
        name: { S: character.name },
        height: { S: character.height },
        mass: { S: character.mass },
        hairColor: { S: character.hairColor },
        skinColor: { S: character.skinColor },
        eyeColor: { S: character.eyeColor },
        birthYear: { S: character.birthYear },
        gender: { S: character.gender },
        homeworld: { S: character.homeworld },
      },
      // Item: marshall({ character })
    };
    await this.client.send(new PutItemCommand(params));
  }

  async findByName(name: string): Promise<Character | null> {
    const params = {
      TableName: this.tableName,
      Key: { name: { S: name } },
      Limit: 1,
    };
    const result = await this.client.send(new GetItemCommand(params));
    if (result.Item) {
      return unmarshall(result.Item) as Character;
    }
    return null;
  }
}
