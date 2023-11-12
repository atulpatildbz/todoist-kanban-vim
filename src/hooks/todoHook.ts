import { TodoistApi } from "@doist/todoist-api-typescript";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TODO_KEY } from "../constants/queryKeys";

export const useTodoList = (api: TodoistApi) => {
  return useQuery({
    queryKey: [TODO_KEY],
    queryFn: () => {
      return api.getTasks();
    },
  });
};
