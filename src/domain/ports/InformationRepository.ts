import { Information } from "../entities/Information";

export interface InformationRepository {
  save(information: Information): Promise<void>;
}
