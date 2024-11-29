import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import middy from '@middy/core'
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { logger, metrics, tracer } from "../utils/powertools";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import { GetCharacter } from "../domain/use-cases/GetCharacter";
import { DynamoDBCharacterRepository } from "../adapters/outgoing/DynamoDBCharacterRepository";

const characterRepository = new DynamoDBCharacterRepository();
const getCharacter = new GetCharacter(characterRepository);

// GET: /historial
// GET: /historial?limit=1&lastEvaluatedKey=R2-D2

const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {

  logger.appendKeys({
    resource_path: event.requestContext.resourcePath
  });

  try {
    metrics.addMetric('historialRetrieved', 'Count', 1);

    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit)
      : 10;

    const lastEvaluatedKey = event.queryStringParameters?.lastEvaluatedKey || null;

    const result = await getCharacter.getPaginateData(limit, lastEvaluatedKey);

    logger.info("Se encontro datos, se devuelven paginados");
    metrics.addMetric('historialRetrieved', MetricUnit.Count, 1);
    metrics.addMetadata('count', result.count.toString());
    metrics.addMetadata('limit', limit.toString());
    // metrics.addMetadata('lastEvaluatedKey',lastEvaluatedKey?.toString );

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error al obtener el historial:", error);

    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(error),
    };
  }
};

export const handler: APIGatewayProxyHandler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(injectLambdaContext(logger, { clearState: true }));