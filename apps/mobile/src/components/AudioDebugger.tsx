import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, ActivityIndicator } from "react-native";
import { getAudioEngine } from "@ab/audio-engine";
import type { AudioEngineSnapshot } from "@ab/audio-engine";
import { PlaybackBundleVMSchema } from "@ab/contracts";

const DUMMY_BUNDLE = {
    sessionId: "test-session-123",
    affirmationsMergedUrl: "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav", // Working public WAV
    background: {
        urlByPlatform: { ios: "https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav", android: "https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav" },
        loop: true
    },
    binaural: {
        urlByPlatform: { ios: "https://www2.cs.uic.edu/~i101/SoundFiles/PinkPanther30.wav", android: "https://www2.cs.uic.edu/~i101/SoundFiles/PinkPanther30.wav" },
        loop: true,
        hz: 10
    },
    mix: { affirmations: 1, binaural: 0.1, background: 0.2 },
    effectiveAffirmationSpacingMs: 1000,
};

export const AudioDebugger = () => {
    const [state, setState] = useState<AudioEngineSnapshot>(getAudioEngine().getState());

    useEffect(() => {
        return getAudioEngine().subscribe(setState);
    }, []);

    const load = async () => {
        try {
            // Validate schema just to be safe it mimics real flow
            // Note: In real app, we fetch from API
            await getAudioEngine().load(DUMMY_BUNDLE as any);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Audio Debugger V3</Text>

            <View style={styles.statusBox}>
                <Text>Status: {state.status}</Text>
                <Text>Session: {state.sessionId || "None"}</Text>
                <Text>Time: {(state.positionMs / 1000).toFixed(1)}s</Text>
                {state.error && <Text style={styles.error}>{state.error.message}</Text>}
            </View>

            <View style={styles.controls}>
                <Button title="Load Dummy" onPress={load} />
                <View style={styles.spacer} />
                <Button title="Play" onPress={() => getAudioEngine().play()} disabled={state.status !== "ready" && state.status !== "paused"} />
                <View style={styles.spacer} />
                <Button title="Pause" onPress={() => getAudioEngine().pause()} disabled={state.status !== "playing"} />
                <View style={styles.spacer} />
                <Button title="Stop" onPress={() => getAudioEngine().stop()} disabled={state.status === "idle"} />
            </View>

            <View style={styles.mixControls}>
                <Text>Mix</Text>
                <Button title="Vocals Only" onPress={() => getAudioEngine().setMix({ affirmations: 1, binaural: 0, background: 0 })} />
                <Button title="Full Mix" onPress={() => getAudioEngine().setMix({ affirmations: 1, binaural: 0.5, background: 0.5 })} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#eee",
        borderRadius: 10,
        margin: 20,
    },
    title: {
        fontWeight: "bold",
        fontSize: 18,
        marginBottom: 10,
    },
    statusBox: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: "white",
        borderRadius: 5,
    },
    error: {
        color: "red",
    },
    controls: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    spacer: {
        width: 10,
    },
    mixControls: {
        gap: 5,
    }
});
