import { useQuery } from "@tanstack/react-query";
import { type EntitlementV3 } from "@ab/contracts";
import { apiGet } from "../lib/api";

export function useEntitlement() {
    const { data, isLoading, error, refetch } = useQuery<EntitlementV3>({
        queryKey: ["entitlement"],
        queryFn: async () => {
            const res = await apiGet<EntitlementV3>("/me/entitlement");
            return res;
        },
        // Refresh reasonably often since limits change
        staleTime: 1000 * 60 * 5, // 5 min
    });

    return {
        entitlement: data,
        isLoading,
        error,
        refreshEntitlement: refetch,
    };
}
