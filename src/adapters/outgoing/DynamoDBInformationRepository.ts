import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { InformationRepository } from "../../domain/ports/InformationRepository";
import { Information } from "../../domain/entities/Information";

export class DynamoDBInformationRepository implements InformationRepository {
  private tableName = process.env.INFORMATION_TABLE!;
  private client = new DynamoDBClient({ region: process.env.AWS_DEFAULT_REGION });

  async save(information: Information): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: {
        id: { S: information.id },
        data: { S: information.data },
      },
    };

    await this.client.send(new PutItemCommand(params));
  }
}
