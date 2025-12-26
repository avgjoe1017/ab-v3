/**
 * Sign-In Screen
 * 
 * Clerk authentication screen for mobile app
 * Shows when user is not authenticated
 */

import React from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput } from "react-native";
import { useAuth, useSignIn, useSignUp, useOAuth } from "@clerk/clerk-expo";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme";

// Extract commonly used colors for easier access
const colors = theme.colors;

export default function SignInScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  
  // OAuth hooks for social sign-in
  const googleOAuth = useOAuth({ strategy: "oauth_google" });
  const appleOAuth = useOAuth({ strategy: "oauth_apple" });
  
  // State for email verification (second factor)
  const [needsEmailVerification, setNeedsEmailVerification] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState("");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  // If already signed in, this screen shouldn't show (handled by parent)
  if (isSignedIn) {
    return null;
  }

  const handleSignIn = async () => {
    if (!signInLoaded || !signIn) {
      setError("Sign-in not ready. Please try again.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      const status = result.status;
      console.log("[SignIn] Sign-in result status:", status);

      // Handle different sign-in statuses
      // IMPORTANT: Don't access result properties that might trigger redirects in React Native
      if (status === "complete") {
        const sessionId = (result as any).createdSessionId;
        if (sessionId) {
          try {
            // For React Native, setActive might try to redirect - catch and handle gracefully
            await setActive({ session: sessionId });
            // Navigation will happen automatically via auth state change
          } catch (setActiveError: any) {
            console.error("[SignIn] setActive error:", setActiveError);
            // In React Native, setActive might fail with redirect errors (href undefined)
            // But the session is still created, so auth state should update automatically
            // Don't show error - let the auth state update naturally
            // The App.tsx will detect isSignedIn and show the main app
          }
        } else {
          setError("Session creation failed. Please try again.");
        }
      } else if (status === "needs_first_factor") {
        // Password might be wrong, or needs additional verification
        setError("Invalid email or password. Please try again.");
      } else if (status === "needs_second_factor") {
        // Email verification required (new device/client)
        // This is normal security behavior - Clerk requires email verification on new devices
        console.log("[SignIn] needs_second_factor - email verification required for new device");
        
        const supportedSecondFactors = (result as any).supportedSecondFactors || [];
        console.log("[SignIn] Supported second factors:", JSON.stringify(supportedSecondFactors, null, 2));
        
        // Find email_code strategy
        const emailCodeStrategy = supportedSecondFactors.find((f: any) => f.strategy === "email_code");
        
        if (emailCodeStrategy) {
          // Prepare email code verification
          try {
            await signIn.prepareSecondFactor({ strategy: "email_code" });
            console.log("[SignIn] Email verification code sent");
            setNeedsEmailVerification(true);
            setError(null);
            // Don't set loading to false - we're waiting for code input
            return;
          } catch (prepError: any) {
            console.error("[SignIn] Failed to prepare email verification:", prepError);
            setError("Failed to send verification code. Please try again.");
          }
        } else {
          setError("Email verification required but email_code strategy not available. Please contact support.");
        }
      } else if (status === "needs_new_password") {
        setError("Password reset required. Please use 'Forgot Password'.");
      } else {
        // Log the actual status for debugging
        console.warn("[SignIn] Unexpected status:", status);
        setError(`Sign-in incomplete (status: ${status}). Please try again.`);
      }
    } catch (err: any) {
      console.error("[SignIn] Sign-in error:", err);
      
      // Handle specific error types
      const errorMsg = err?.message || "";
      if (errorMsg.includes("href") || errorMsg.includes("redirect") || errorMsg.includes("Cannot read property 'href'")) {
        // This is a React Native redirect error - happens when Clerk tries to redirect
        // The error occurs because React Native doesn't support web redirects
        // BUT: The user might actually be signed in despite the error!
        console.warn("[SignIn] Redirect error (React Native) - checking if user is actually signed in...");
        
        // Wait a moment for auth state to update, then check
        setTimeout(() => {
          // Check auth state - if user is signed in, don't show error
          // The App.tsx will handle navigation automatically
          if (isSignedIn) {
            console.log("[SignIn] User is signed in despite redirect error - success!");
            // Don't set error, let auth state handle navigation
            return;
          }
          // If still not signed in, show helpful error
          setError("Sign-in encountered a redirect issue. This may be due to bot protection. Try: 1) Disable bot protection in Clerk dashboard, or 2) Sign up with a new account.");
        }, 500);
        return;
      }
      
      // Extract error message safely
      let errorMessage = "Sign-in failed. Please try again.";
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        errorMessage = err.errors[0]?.message || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpLoaded || !signUp) {
      setError("Sign-up not ready. Please try again.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!signUpLoaded || !signUp) {
      setError("Verification not ready. Please try again.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        await setActiveSignUp({ session: result.createdSessionId });
        // Navigation will happen automatically via auth state change
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Verification failed. Please check your code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailForSignIn = async () => {
    if (!signInLoaded || !signIn) {
      setError("Verification not ready. Please try again.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: verificationCode,
      });

      if (result.status === "complete") {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          // Navigation will happen automatically via auth state change
        } else {
          setError("Session creation failed. Please try again.");
        }
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Verification failed. Please check your code.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "apple") => {
    setError(null);
    setLoading(true);

    try {
      const oauthHook = provider === "google" ? googleOAuth : appleOAuth;
      const { createdSessionId, setActive: setActiveOAuth } = await oauthHook.startOAuthFlow();

      if (createdSessionId) {
        await setActiveOAuth({ session: createdSessionId });
        // Navigation will happen automatically via auth state change
      } else {
        setError(`${provider === "google" ? "Google" : "Apple"} sign-in failed. Please try again.`);
      }
    } catch (err: any) {
      console.error(`[OAuth] ${provider} sign-in error:`, err);
      // User might have canceled - don't show error
      if (err?.errors?.[0]?.code !== "oauth_access_denied") {
        setError(err.errors?.[0]?.message || `${provider === "google" ? "Google" : "Apple"} sign-in failed. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Email verification screen for sign-up
  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <MaterialIcons name="email" size={64} color={colors.accent.primary} />
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We sent a verification code to {email}
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <View style={styles.codeInputContainer}>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={setCode}
                placeholder="Enter code"
                keyboardType="number-pad"
                autoFocus
              />
            </View>
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyEmail}
            disabled={loading || !code}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify Email</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.linkButton}
            onPress={() => {
              setPendingVerification(false);
              setCode("");
              setError(null);
            }}
          >
            <Text style={styles.linkText}>Back to Sign Up</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Email verification screen for sign-in (new device)
  if (needsEmailVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <MaterialIcons name="email" size={64} color={colors.accent.primary} />
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We sent a verification code to {email}
          </Text>
          <Text style={[styles.subtitle, { fontSize: 14, marginTop: 8 }]}>
            This is required for signing in from a new device
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <View style={styles.codeInputContainer}>
              <TextInput
                style={styles.codeInput}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="Enter code"
                keyboardType="number-pad"
                autoFocus
              />
            </View>
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyEmailForSignIn}
            disabled={loading || !verificationCode}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify & Sign In</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.linkButton}
            onPress={() => {
              setNeedsEmailVerification(false);
              setVerificationCode("");
              setError(null);
            }}
          >
            <Text style={styles.linkText}>Back to Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Sign-in/Sign-up screen
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialIcons name="auto-awesome" size={64} color={colors.accent.primary} />
        <Text style={styles.title}>Affirmation Beats</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? "Create your account" : "Sign in to continue"}
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholderTextColor={colors.text.muted}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isSignUp ? "password-new" : "password"}
            placeholderTextColor={colors.text.muted}
          />
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={isSignUp ? handleSignUp : handleSignIn}
          disabled={loading || !email || !password}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? "Sign Up" : "Sign In"}
            </Text>
          )}
        </Pressable>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <Pressable
          style={[styles.socialButton, styles.googleButton, loading && styles.buttonDisabled]}
          onPress={() => handleOAuthSignIn("google")}
          disabled={loading}
        >
          <Text style={styles.socialButtonText}>🔵 Continue with Google</Text>
        </Pressable>

        <Pressable
          style={[styles.socialButton, styles.appleButton, loading && styles.buttonDisabled]}
          onPress={() => handleOAuthSignIn("apple")}
          disabled={loading}
        >
          <Text style={styles.socialButtonText}>🍎 Continue with Apple</Text>
        </Pressable>

        <Pressable
          style={styles.linkButton}
          onPress={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
        >
          <Text style={styles.linkText}>
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 32,
    textAlign: "center",
  },
  errorContainer: {
    width: "100%",
    backgroundColor: "#fee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#c00",
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  codeInputContainer: {
    backgroundColor: colors.background.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text.primary,
    letterSpacing: 8,
    textAlign: "center",
  },
  button: {
    width: "100%",
    backgroundColor: colors.accent.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: colors.accent.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  dividerContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  socialButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: "#4285F4",
    borderColor: "#4285F4",
  },
  appleButton: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  socialButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

