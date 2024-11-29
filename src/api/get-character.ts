import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import middy from '@middy/core'
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { logger, metrics, tracer } from "../utils/powertools";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { MetricUnit } from '@aws-lambda-powertools/metrics';
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import { GetCharacter } from "../domain/use-cases/GetCharacter";
import { SWAPIService } from "../adapters/outgoing/SWAPIService";
import { DynamoDBCharacterRepository } from "../adapters/outgoing/DynamoDBCharacterRepository";
import { SaveCharacter } from "../domain/use-cases/SaveCharacter";

const characterRepository = new DynamoDBCharacterRepository();
const getCharacter = new GetCharacter(characterRepository);
const saveCharacter = new SaveCharacter(characterRepository);
const swapiService = new SWAPIService();

// GET: /fusionados?s=Darth Vader

const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {

  logger.appendKeys({
    resource_path: event.requestContext.resourcePath
  });

  const name = event.queryStringParameters?.name;
  if (name === undefined) {
    logger.warn('Falta el parámetro \'name\' en la URL para realizar la búsqueda de un personaje', {
      details: { queryStringParameters: event.queryStringParameters }
    });

    return {
      statusCode: 400,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Falta el parámetro 'name' en la URL" }),
    };
  }
  try {
    metrics.addMetric('charactersRetrieved', 'Count', 1);
    metrics.addMetadata('characterName', name);
    
    let result = await getCharacter.execute(name);
    
    if (!result) {
      logger.info("El personaje no existe, se busca ahora en el servicio SWAPI", { details: { name } });
      const character = await swapiService.getFirstCharacterBySearch(name);
      console.log(character);
      if (character) {
        await saveCharacter.execute(character);
        result = character;
      }
    }

    if (!result) {
      logger.warn("No existe el personaje con el NAME " + name + " en la base de datos ni en el servicio SWAPI");

      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Personaje no encontrado" }),
      };
    }

    logger.info('Personaje buscado con NAME: ' + name, { details: { character: result } });
    metrics.addMetric('characterRetrieved', MetricUnit.Count, 1);
    metrics.addMetadata('characterId', result.id);
    metrics.addMetadata('characterName', result.name);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.warn(error);
    logger.error("Se ha producido un error al intentar recuperar datos de un personaje", error);

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