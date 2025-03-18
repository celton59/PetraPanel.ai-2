import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { UserSession } from "@db/schema";

interface UserActivityStats {
  activeSessions: number;
  averageSessionDuration: number;
  totalUsers: number;
  returningUsers: number;
}

interface UserActivityData {
  stats: UserActivityStats;
  sessions: UserSession[];
}

export function useUserActivity(timeRange: string = "week") {
  return useQuery({
    queryKey: ["user-activity", timeRange],
    queryFn: async () => {
      const { data } = await axios.get<UserActivityData>(`/api/admin/activity?timeRange=${timeRange}`);
      return data;
    }
  });
}
