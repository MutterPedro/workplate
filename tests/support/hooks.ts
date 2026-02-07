import { Before, After } from "@cucumber/cucumber";
import { cleanup } from "@testing-library/react";
import type { WorkPlateWorld } from "./world";

Before(function (this: WorkPlateWorld) {
  this.repository = new (require("../../src/services/task-repository.mock").MockTaskRepository)();
});

After(function (this: WorkPlateWorld) {
  cleanup();
});
