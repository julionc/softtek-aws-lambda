// src/api/almacenar.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import middy from "@middy/core";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import { logger, metrics, tracer } from "../utils/powertools";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import { SaveInformation } from "../domain/use-cases/SaveInformation";
import { DynamoDBInformationRepository } from "../adapters/outgoing/DynamoDBInformationRepository";

const informationRepository = new DynamoDBInformationRepository();
const saveInformation = new SaveInformation(informationRepository);

// POST: /almacenar

const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  
  logger.appendKeys({
    resource_path: event.requestContext.resourcePath
  });

  try {
    metrics.addMetric('informationStored', 'Count', 1);

    let data = JSON.parse(event.body || "{}").data;
    if (!data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Data es requerido" }),
      };
    }

    const result = await saveInformation.execute(data);

    logger.info("Información almacenada");
    metrics.addMetric('informationStored', 'Count', 1);

    return {
      statusCode: 201,
      body: JSON.stringify(
        { message: "Información almacenada correctamente",
          data: result.data,
        }
      ),
    };
  } catch (error) {
    console.error("Error al almacenar la información:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(error),
    };
  }
};

export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(injectLambdaContext(logger, { clearState: true }));
