import { World, setWorldConstructor } from "@cucumber/cucumber";
import { MockTaskRepository } from "../../src/services/task-repository.mock";

export class WorkPlateWorld extends World {
  repository: MockTaskRepository;
  container: HTMLDivElement | null = null;
  cleanup: (() => void) | null = null;

  constructor(options: any) {
    super(options);
    this.repository = new MockTaskRepository();
  }
}

setWorldConstructor(WorkPlateWorld);
