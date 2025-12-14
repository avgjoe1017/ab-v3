/**
 * Test Data Helper Component
 * 
 * This component helps with testing by showing API connection status
 * and providing quick access to test sessions.
 * 
 * Only shown in development mode.
 */

import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { apiGet } from "../lib/api";
import { API_BASE_URL } from "../lib/config";

export const TestDataHelper = () => {
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "error">("checking");
  const [sessionsCount, setSessionsCount] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(true); // Collapsed by default

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setApiStatus("connected");
        // Try to get sessions count
        try {
          const sessions = await apiGet<{ sessions: any[] }>("/sessions");
          setSessionsCount(sessions.sessions.length);
        } catch {
          // Ignore sessions error
        }
      } else {
        setApiStatus("error");
      }
    } catch (error) {
      setApiStatus("error");
    }
  };

  // Only show in development
  if (!__DEV__) return null;

  if (collapsed) {
    return (
      <Pressable style={styles.collapsedContainer} onPress={() => setCollapsed(false)}>
        <Text style={styles.collapsedText}>🔧 Test Helper (tap to expand)</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setCollapsed(true)} style={styles.header}>
        <Text style={styles.title}>🔧 Test Helper (Dev Only)</Text>
        <Text style={styles.collapseText}>▼ Collapse</Text>
      </Pressable>
      
      <View style={styles.statusRow}>
        <Text style={styles.label}>API Status:</Text>
        <Text style={[styles.status, apiStatus === "connected" ? styles.connected : styles.error]}>
          {apiStatus === "checking" ? "Checking..." : apiStatus === "connected" ? "✅ Connected" : "❌ Not Connected"}
        </Text>
      </View>

      {apiStatus === "connected" && sessionsCount !== null && (
        <Text style={styles.info}>
          Sessions available: {sessionsCount}
        </Text>
      )}

      <Text style={styles.info}>
        Current URL: {API_BASE_URL}
      </Text>

      {apiStatus === "error" && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            API server not reachable
          </Text>
          <Text style={styles.errorHint}>
            Trying to connect to:{'\n'}
            {API_BASE_URL}
          </Text>
          <Text style={styles.errorHint}>
            Platform: {Platform.OS}
          </Text>
          <Text style={styles.errorHint}>
            {'\n'}Troubleshooting:{'\n'}
            • Android emulator: Should use 10.0.2.2{'\n'}
            • iOS simulator: Should use 127.0.0.1{'\n'}
            • Physical device: Use your computer's IP{'\n'}
            {'\n'}See API_CONNECTION_FIX.md for details
          </Text>
        </View>
      )}

      <Pressable style={styles.button} onPress={checkApiConnection}>
        <Text style={styles.buttonText}>Refresh Status</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  collapsedContainer: {
    padding: 8,
    backgroundColor: "#ddd",
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  collapsedText: {
    fontSize: 12,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  collapseText: {
    fontSize: 12,
    color: "#666",
  },
  container: {
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    marginRight: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
  },
  connected: {
    color: "#22c55e",
  },
  error: {
    color: "#ef4444",
  },
  info: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  errorBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 4,
  },
  errorText: {
    fontSize: 11,
    color: "#991b1b",
    marginBottom: 4,
  },
  errorHint: {
    fontSize: 10,
    color: "#991b1b",
    fontStyle: "italic",
  },
  button: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#3b82f6",
    borderRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});

