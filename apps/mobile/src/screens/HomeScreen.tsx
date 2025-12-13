import React, { useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { useDraftStore } from "../state/useDraftStore";
import { useEntitlement } from "../hooks/useEntitlement";

type SessionRow = { id: string; title: string; durationSec: number };

export default function HomeScreen({ navigation }: any) {
  const { initializeDraft } = useDraftStore();
  const { entitlement, refreshEntitlement } = useEntitlement();

  // Refresh entitlement on mount/focus
  useEffect(() => {
    refreshEntitlement();
  }, [refreshEntitlement]);

  const { data: sessions, refetch } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await apiGet<{ sessions: SessionRow[] }>("/sessions");
      return res.sessions;
    },
  });

  const handleCreate = () => {
    initializeDraft();
    navigation.navigate("Editor");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Sessions</Text>

      {entitlement && (
        <View style={[styles.banner, !entitlement.canCreateSession && styles.bannerLimit]}>
          <Text style={styles.bannerText}>
            Plan: {entitlement.plan.toUpperCase()} • Daily: {entitlement.remainingFreeGenerationsToday} left
          </Text>
          {!entitlement.canCreateSession && <Text style={styles.limitText}>Limit Reached</Text>}
        </View>
      )}

      <Pressable
        onPress={handleCreate}
        disabled={entitlement && !entitlement.canCreateSession}
        style={[styles.btn, entitlement && !entitlement.canCreateSession && styles.btnDisabled]}
      >
        <Text style={styles.btnText}>+ New Session</Text>
      </Pressable>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        refreshing={false}
        onRefresh={() => {
          refetch();
          refreshEntitlement();
        }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() => navigation.navigate("Player", { sessionId: item.id })}
          >
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>{Math.round(item.durationSec / 60)} min</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  btn: { backgroundColor: "#000", padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 20 },
  btnDisabled: { backgroundColor: "#ccc" },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  item: { padding: 16, borderBottomWidth: 1, borderColor: "#eee" },
  itemTitle: { fontSize: 18, fontWeight: "500" },
  itemMeta: { color: "#666", marginTop: 4 },
  banner: { padding: 12, backgroundColor: "#f0f9ff", borderRadius: 8, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: "#007bff" },
  bannerLimit: { backgroundColor: "#fff0f0", borderLeftColor: "#dc3545" },
  bannerText: { fontSize: 14, color: "#333" },
  limitText: { color: "#dc3545", fontWeight: "bold", marginTop: 4 }
});
