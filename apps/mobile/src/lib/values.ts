import { apiPost, apiGet, apiPut } from "./api";
import type { Value } from "../screens/ValueSelectionScreen";

export interface UserValue {
  id: string;
  userId: string;
  valueId: string;
  valueText: string;
  rank: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function saveUserValues(values: Value[], authToken?: string | null): Promise<{ success: boolean; count: number }> {
  // Map values to include rank (top 3 get ranks 1-3, rest are null)
  const valuesWithRank = values.map((value, index) => ({
    valueId: value.valueId,
    valueText: value.valueText,
    rank: index < 3 ? index + 1 : null,
  }));

  return apiPost("/me/values", { values: valuesWithRank }, authToken);
}

export async function getUserValues(authToken?: string | null): Promise<{ values: UserValue[] }> {
  return apiGet("/me/values", authToken);
}

export async function saveUserStruggle(struggle?: string, authToken?: string | null): Promise<{ success: boolean; struggle: string | null }> {
  return apiPut("/me/struggle", { struggle: struggle || null }, authToken);
}

export async function getUserStruggle(authToken?: string | null): Promise<{ struggle: string | null }> {
  return apiGet("/me/struggle", authToken);
}

