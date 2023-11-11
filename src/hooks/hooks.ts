import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TODOIST_API_KEY } from "../constants/queryKeys";

export function useTodoistKey() {
  return useQuery({
    queryKey: [TODOIST_API_KEY],
    queryFn: () => {
      return new Promise((resolve, reject) => {
        const todoistApiKey: string | null =
          localStorage.getItem(TODOIST_API_KEY);
        if (!todoistApiKey) {
          reject(new Error(`No ${TODOIST_API_KEY} found in localStorage`));
        } else {
          resolve(todoistApiKey);
        }
      });
    },
  });
}

export function useMutationTodoistKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newKey: string) => {
      return new Promise((resolve, reject) => {
        try {
          localStorage.setItem(TODOIST_API_KEY, newKey);
          resolve("Success");
        } catch (error) {
          reject(error);
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TODOIST_API_KEY] });
    },
  });
}
