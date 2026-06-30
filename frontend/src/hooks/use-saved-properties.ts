"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import {
  fetchSavedProperties,
  fetchSavedPropertyIds,
  saveProperty,
  unsaveProperty,
} from "@/lib/api/saved-properties";

export const SAVED_PROPERTIES_QUERY_KEY = ["saved-properties"] as const;
export const SAVED_PROPERTY_IDS_QUERY_KEY = ["saved-property-ids"] as const;

export function useSavedPropertyIds() {
  const { accessToken, canSave, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: SAVED_PROPERTY_IDS_QUERY_KEY,
    queryFn: () => fetchSavedPropertyIds(accessToken!),
    enabled: isAuthenticated && canSave && Boolean(accessToken),
    staleTime: 30_000,
    select: (ids) => ids,
  });
}

export function useSavedProperties(page = 1) {
  const { accessToken, canSave, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...SAVED_PROPERTIES_QUERY_KEY, page],
    queryFn: () => fetchSavedProperties(accessToken!, page),
    enabled: isAuthenticated && canSave && Boolean(accessToken),
    staleTime: 30_000,
  });
}

export function useToggleSaveProperty(propertyId: string, initialSaved = false) {
  const queryClient = useQueryClient();
  const { accessToken, canSave, isAuthenticated } = useAuth();

  const idsQuery = useSavedPropertyIds();
  const isSaved =
    idsQuery.data?.has(propertyId) ??
    initialSaved;

  const mutation = useMutation({
    mutationFn: async (nextSaved: boolean) => {
      if (!accessToken) throw new Error("Not authenticated");
      if (nextSaved) {
        await saveProperty(propertyId, accessToken);
      } else {
        await unsaveProperty(propertyId, accessToken);
      }
    },
    onMutate: async (nextSaved) => {
      await queryClient.cancelQueries({ queryKey: SAVED_PROPERTY_IDS_QUERY_KEY });
      const previous = queryClient.getQueryData<Set<string>>(SAVED_PROPERTY_IDS_QUERY_KEY);

      queryClient.setQueryData<Set<string>>(SAVED_PROPERTY_IDS_QUERY_KEY, (old) => {
        const next = new Set(old ?? []);
        if (nextSaved) next.add(propertyId);
        else next.delete(propertyId);
        return next;
      });

      return { previous };
    },
    onError: (_err, _nextSaved, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SAVED_PROPERTY_IDS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_PROPERTY_IDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SAVED_PROPERTIES_QUERY_KEY });
    },
  });

  function toggle() {
    if (!isAuthenticated || !canSave || !accessToken) return false;
    mutation.mutate(!isSaved);
    return true;
  }

  return {
    isSaved,
    toggle,
    isPending: mutation.isPending,
    isAuthenticated,
    canSave,
  };
}
