import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  ScanCommandInput
} from "@aws-sdk/client-dynamodb";
import { Character } from "../../domain/entities/Character";
import { CharacterRepository } from "../../domain/ports/CharacterRepository";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export class DynamoDBCharacterRepository implements CharacterRepository {
  private tableName = process.env.CHARACTER_TABLE!;
  private client = new DynamoDBClient({ region: process.env.AWS_DEFAULT_REGION });
  private cacheDurationInSeconds = parseInt(process.env.TABLE_TTL || "30") * 60;
  private baseUrl = process.env.BASE_URL || "";

  async save(character: Character): Promise<void> {
    const ttl = this.cacheDurationInSeconds
      ? Math.floor(Date.now() / 1000) + this.cacheDurationInSeconds
      : undefined;

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
        ...(ttl && { ttl: { N: ttl.toString() } }),
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

  async getAllPaginated(
    limit: number,
    lastEvaluatedKey?: string | null
  ): Promise<{
    count: number;
    next: string | null;
    results: Character[];
  }> {

    const totalItemsResult = await this.client.send(new ScanCommand({ TableName: this.tableName }));
    const totalCount = totalItemsResult.Count || 0;

    let decodedLastEvaluatedKey: Record<string, any> | undefined = undefined;
    if (lastEvaluatedKey) {
      decodedLastEvaluatedKey = { name: { S: lastEvaluatedKey } };
    }

    const params: ScanCommandInput = {
      TableName: this.tableName,
      Limit: limit,
      ExclusiveStartKey: decodedLastEvaluatedKey,
    };

    const result = await this.client.send(new ScanCommand(params));
    const nextPage = result.LastEvaluatedKey
      ? `${this.baseUrl}/historial?limit=${limit}&lastEvaluatedKey=${result.LastEvaluatedKey.name.S}`
      : null;

    return {
      count: totalCount,
      next: nextPage,
      results: result.Items?.map((item) => unmarshall(item) as Character) || [],
    };
  }
}
