import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getGroupData, getOverview } from "@/lib/splitsmart.functions";

export function useOverview() {
  const fetchOverview = useServerFn(getOverview);
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => fetchOverview(),
  });
}

export function useGroup(groupId: string | undefined) {
  const fetchGroup = useServerFn(getGroupData);
  return useQuery({
    queryKey: ["group", groupId],
    enabled: Boolean(groupId),
    queryFn: () => fetchGroup({ data: { groupId: groupId! } }),
  });
}

export type OverviewData = Awaited<ReturnType<typeof getOverview>>;
export type GroupData = Awaited<ReturnType<typeof getGroupData>>;
