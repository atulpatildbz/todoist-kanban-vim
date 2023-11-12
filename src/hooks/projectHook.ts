import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PROJECT } from "../constants/queryKeys";
import { TodoistApi } from "@doist/todoist-api-typescript";

export const useProjectList = (api: TodoistApi) => {
  return useQuery({
    queryKey: [PROJECT],
    queryFn: () => {
      return api.getProjects();
    },
  });
};
