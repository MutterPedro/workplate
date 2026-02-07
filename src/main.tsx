import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { RepositoryProvider } from "./services/repository-context";
import { TauriTaskRepository } from "./services/task-repository";
import "./styles.css";

const repo = new TauriTaskRepository();

repo.seed().then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <RepositoryProvider repository={repo}>
          <App />
        </RepositoryProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
}).catch((err) => {
  console.error("Failed to initialize database:", err);
  // Still render the app — it'll show errors inline
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <RepositoryProvider repository={repo}>
          <App />
        </RepositoryProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
});
