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

export const useUpdateTodo = (api: TodoistApi) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: Task["id"]; data: Partial<Task> }) => {
      return api.updateTask(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TODO_KEY] });
    },
  });
};

export const useCreateTodo = (api: TodoistApi) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Task>) => {
      return api.addTask(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TODO_KEY] });
    },
  });
};

export const useDeleteTodo = (api: TodoistApi) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: Task["id"]) => {
      return api.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TODO_KEY] });
    },
    onMutate: async (id: Task["id"]) => {
      await queryClient.cancelQueries({ queryKey: [TODO_KEY] });
      const previousTodos = queryClient.getQueryData([TODO_KEY]);
      queryClient.setQueryData([TODO_KEY], (todos: Task[]) => {
        return todos.filter((todo) => todo.id !== id);
      });
      return { previousTodos };
    },
  });
};

export const useCloseTask = (api: TodoistApi) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: Task["id"]) => {
      return api.closeTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TODO_KEY] });
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
