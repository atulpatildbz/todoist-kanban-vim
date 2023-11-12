import { Task, TodoistApi } from "@doist/todoist-api-typescript";
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

export const useTodoListByParentId = (api: TodoistApi, parentId?: string) => {
  const todoListQuery = useTodoList(api);

  return {
    ...todoListQuery,
    data: todoListQuery.data?.filter((todo) =>
      parentId ? todo.parentId === parentId : todo.parentId === null
    ),
  };
};

export const useTodoParentSet = (api: TodoistApi) => {
  return useQuery({
    queryKey: [TODO_KEY],
    queryFn: () => {
      return api.getTasks();
    },

    select: (todos: Task[]) => {
      return new Set(
        todos
          .filter((todo) => todo.parentId !== null)
          .map((todo) => todo.parentId)
      );
    },
  });
};
