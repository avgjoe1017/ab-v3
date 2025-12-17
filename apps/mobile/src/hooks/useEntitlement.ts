import { useQuery } from "@tanstack/react-query";
import { type EntitlementV3 } from "@ab/contracts";
import { apiGet } from "../lib/api";
import { useAuthToken } from "../lib/auth";

export function useEntitlement() {
    const authToken = useAuthToken();
    
    const { data, isLoading, error, refetch } = useQuery<EntitlementV3>({
        queryKey: ["entitlement", authToken],
        queryFn: async () => {
            const res = await apiGet<EntitlementV3>("/me/entitlement", authToken);
            return res;
        },
        // Refresh reasonably often since limits change
        staleTime: 1000 * 60 * 5, // 5 min
        enabled: true, // Always enabled, auth token is optional (falls back to default user)
    });

    return {
        entitlement: data,
        isLoading,
        error,
        refreshEntitlement: refetch,
    };
}
