import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { PlaybackBundleVMSchema, type PlaybackBundleVM } from "@ab/contracts";
import { getAudioEngine } from "@ab/audio-engine";

export default function PlayerScreen({ route }: any) {
  const sessionId: string = route.params.sessionId;

  const { data, isLoading, error } = useQuery({
    queryKey: ["playback-bundle", sessionId],
    queryFn: async () => {
      const json = await apiGet<{ bundle: PlaybackBundleVM }>(`/sessions/${sessionId}/playback-bundle`);
      return PlaybackBundleVMSchema.parse(json.bundle);
    },
  });

  const engine = useMemo(() => getAudioEngine(), []);
  const [status, setStatus] = useState(engine.getState().status);

  useEffect(() => engine.subscribe((s) => setStatus(s.status)), [engine]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Player</Text>
      <Text>Session: {sessionId}</Text>
      <Text>Status: {status}</Text>

      {isLoading && <Text>Loading bundle...</Text>}
      {error && <Text>Failed to load bundle</Text>}

      <Pressable
        disabled={!data}
        onPress={async () => {
          if (!data) return;
          await engine.load(data);
        }}
        style={{ padding: 12, borderWidth: 1, borderColor: "#444" }}
      >
        <Text>Load</Text>
      </Pressable>

      <Pressable
        onPress={() => engine.play()}
        style={{ padding: 12, borderWidth: 1, borderColor: "#444" }}
      >
        <Text>Play</Text>
      </Pressable>

      <Pressable
        onPress={() => engine.pause()}
        style={{ padding: 12, borderWidth: 1, borderColor: "#444" }}
      >
        <Text>Pause</Text>
      </Pressable>

      <Pressable
        onPress={() => engine.stop()}
        style={{ padding: 12, borderWidth: 1, borderColor: "#444" }}
      >
        <Text>Stop</Text>
      </Pressable>
    </View>
  );
}
