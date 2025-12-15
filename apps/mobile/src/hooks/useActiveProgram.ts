import { useQuery } from "@tanstack/react-query";
import { getAllProgramProgress, getCurrentDay } from "../storage/programProgress";
import { PLACEHOLDER_PROGRAMS } from "../types/program";

/**
 * Hook to get the currently active program (one that's in progress)
 */
export function useActiveProgram() {
  return useQuery({
    queryKey: ["active-program"],
    queryFn: async () => {
      const allProgress = await getAllProgramProgress();
      
      // Find programs that have at least one completed day but aren't complete
      for (const program of PLACEHOLDER_PROGRAMS) {
        const progress = allProgress.filter(p => p.programId === program.id && p.completed);
        if (progress.length > 0) {
          const currentDay = await getCurrentDay(program.id, program.totalDays);
          // If not all days are complete, it's active
          if (currentDay <= program.totalDays) {
            return {
              program,
              currentDay,
            };
          }
        }
      }
      
      return null;
    },
  });
}

