import { TodoistApi } from "@doist/todoist-api-typescript";
import { createContext } from "react";

export const TodoistContext = createContext<TodoistApi | null>(null);
