import { Before, After } from "@cucumber/cucumber";
import { cleanup } from "@testing-library/react";
import { MockTaskRepository } from "../../src/services/task-repository.mock";
import type { WorkPlateWorld } from "./world";

Before(function (this: WorkPlateWorld) {
  this.repository = new MockTaskRepository();
});

After(function () {
  cleanup();
});
