import { useQuery } from "@tanstack/react-query";
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

export const useProjectIdToNameMap = (api: TodoistApi) => {
  const projectListQuery = useProjectList(api);
  return {
    ...projectListQuery,
    data: projectListQuery.data?.reduce((acc, project) => {
      acc[project.id] = project.name;
      return acc;
    }, {} as Record<string, string>),
  };
};
