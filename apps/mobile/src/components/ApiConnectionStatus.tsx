import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { API_BASE_URL } from "../lib/config";
import { theme } from "../theme";

export function ApiConnectionStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [lastError, setLastError] = useState<string | null>(null);

  const checkConnection = async () => {
    setStatus("checking");
    setLastError(null);
    
    try {
      const apiUrl = String(API_BASE_URL || "");
      if (!apiUrl) {
        setStatus("disconnected");
        setLastError("API URL not configured");
        return;
      }

      const response = await fetch(`${apiUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        try {
          const data = await response.json();
          if (data && typeof data === "object" && data.ok === true) {
            setStatus("connected");
            setLastError(null);
          } else {
            setStatus("disconnected");
            setLastError("Health check returned unexpected response");
          }
        } catch (jsonError) {
          setStatus("disconnected");
          setLastError("Invalid JSON response from server");
        }
      } else {
        setStatus("disconnected");
        setLastError(`HTTP ${response.status}: ${response.statusText || "Unknown error"}`);
      }
    } catch (error) {
      setStatus("disconnected");
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === "string"
        ? error
        : "Unknown error occurred";
      setLastError(errorMessage);
    }
  };

  useEffect(() => {
    checkConnection();
    // Auto-refresh every 5 seconds
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "#10b981"; // green
      case "disconnected":
        return "#ef4444"; // red
      case "checking":
        return "#f59e0b"; // amber
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return "check-circle";
      case "disconnected":
        return "error";
      case "checking":
        return "hourglass-empty";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "API Connected";
      case "disconnected":
        return "API Disconnected";
      case "checking":
        return "Checking...";
    }
  };

  // Safely convert API_BASE_URL to string, handling edge cases
  const apiUrlDisplay = (() => {
    if (typeof API_BASE_URL === "string") {
      return API_BASE_URL;
    }
    if (API_BASE_URL == null) {
      return "Unknown";
    }
    // Fallback for any other type (object, etc.)
    try {
      return String(API_BASE_URL);
    } catch {
      return "Unknown";
    }
  })();

  return (
    <Pressable 
      style={[styles.container, { borderColor: getStatusColor() }]}
      onPress={checkConnection}
    >
      <MaterialIcons name={getStatusIcon()} size={16} color={getStatusColor()} />
      <View style={styles.textContainer}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        <Text style={styles.urlText} numberOfLines={1}>
          {apiUrlDisplay}
        </Text>
        {lastError && status === "disconnected" && (
          <Text style={styles.errorText} numberOfLines={2}>
            {String(lastError)}
          </Text>
        )}
      </View>
      <MaterialIcons name="refresh" size={16} color={theme.colors.text.tertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: theme.colors.background.surface,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 4,
  },
  statusText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  urlText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 10,
    color: "#ef4444",
    marginTop: 4,
  },
});

