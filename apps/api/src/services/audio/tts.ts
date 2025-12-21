/**
 * Text-to-Speech Service
 * Supports multiple TTS providers with fallback to beep generation
 */

import fs from "fs-extra";
import path from "path";
import ffmpegStatic from "ffmpeg-static";
import { execFile } from "child_process";
import { promisify } from "util";
import { CHUNKS_DIR } from "./constants";

const execFileAsync = promisify(execFile);

export type TTSProvider = "openai" | "elevenlabs" | "azure" | "beep";

export interface TTSOptions {
  text: string;
  voiceId: string;
  pace: string;
  variant: number; // 1 or 2 for prosody variation
}

/**
 * Generate audio using the configured TTS provider
 * Falls back to beep generation if TTS is unavailable or fails
 */
export async function generateTTSAudio(
  options: TTSOptions,
  outputPath: string
): Promise<void> {
  const provider = getTTSProvider();
  console.log(`[TTS] Using provider: ${provider}`);

  try {
    switch (provider) {
      case "openai":
        console.log(`[TTS] Generating with OpenAI TTS...`);
        await generateOpenAITTS(options, outputPath);
        console.log(`[TTS] ✅ OpenAI TTS generation complete`);
        break;
      case "elevenlabs":
        console.log(`[TTS] Generating with ElevenLabs TTS...`);
        await generateElevenLabsTTS(options, outputPath);
        console.log(`[TTS] ✅ ElevenLabs TTS generation complete`);
        break;
      case "azure":
        console.log(`[TTS] Generating with Azure TTS...`);
        await generateAzureTTS(options, outputPath);
        console.log(`[TTS] ✅ Azure TTS generation complete`);
        break;
      case "beep":
      default:
        console.log(`[TTS] ⚠️  Using beep fallback (TTS not configured)`);
        console.log(`[TTS] To enable real TTS, add to apps/api/.env:`);
        console.log(`[TTS]   TTS_PROVIDER=openai`);
        console.log(`[TTS]   OPENAI_API_KEY=sk-your-key-here`);
        await generateBeepFallback(options, outputPath);
        break;
    }
  } catch (error) {
    console.error(`[TTS] ❌ ${provider} failed:`, error);
    console.warn(`[TTS] Falling back to beep generation`);
    await generateBeepFallback(options, outputPath);
  }
}

/**
 * Get configured TTS provider from environment
 */
function getTTSProvider(): TTSProvider {
  const provider = process.env.TTS_PROVIDER?.toLowerCase();
  
  // Check if API keys are available
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return "openai";
  }
  if (provider === "elevenlabs" && process.env.ELEVENLABS_API_KEY) {
    return "elevenlabs";
  }
  if (provider === "azure" && process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) {
    return "azure";
  }
  
  // Default to beep if no provider configured
  return "beep";
}

/**
 * Generate TTS audio using OpenAI API
 * OpenAI TTS supports natural voices with prosody control
 */
async function generateOpenAITTS(
  options: TTSOptions,
  outputPath: string
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // OpenAI TTS model and voice selection
  // Use calm, neutral voices suitable for affirmations
  const model = "tts-1"; // or "tts-1-hd" for higher quality (more expensive)
  const voice = mapVoiceIdToOpenAI(options.voiceId);
  
  // Adjust speed based on pace (slow = 0.9, normal = 1.0, fast = 1.1)
  // V3 uses "slow" pace only, so default to 0.9
  const speed = options.pace === "slow" ? 0.9 : options.pace === "fast" ? 1.1 : 1.0;
  
  // For variant 2, slightly adjust speed to create prosody variation
  const variantSpeed = options.variant === 2 ? speed * 1.02 : speed;

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: options.text,
      voice,
      speed: variantSpeed, // Slight speed variation for variant 2
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI TTS failed: ${response.status} ${error}`);
  }

  const audioBuffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(audioBuffer));

  // Convert to MP3 with FFmpeg to match V3 audio profile (128kbps, 44.1kHz)
  await convertToMP3(outputPath);
}

/**
 * Map voiceId to OpenAI voice name
 * OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
 * Use calm, neutral voices for affirmations
 */
function mapVoiceIdToOpenAI(voiceId: string): string {
  // Default mapping - can be customized per voiceId
  const voiceMap: Record<string, string> = {
    "default": "nova", // Calm, neutral female voice
    "male": "onyx", // Calm, neutral male voice
    "female": "nova",
    "alloy": "alloy",
    "echo": "echo",
    "fable": "fable",
    "onyx": "onyx",
    "nova": "nova",
    "shimmer": "shimmer",
  };

  return voiceMap[voiceId.toLowerCase()] || "nova";
}

/**
 * Generate TTS audio using ElevenLabs API
 * ElevenLabs provides highly realistic voices with emotional control
 * Configured for slow, meditative, calming, ASMR-like delivery
 */
async function generateElevenLabsTTS(
  options: TTSOptions,
  outputPath: string
): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not configured");
  }

  // Map voiceId to ElevenLabs voice ID
  const voiceId = mapVoiceIdToElevenLabs(options.voiceId);
  
  // Meditative/ASMR settings: Lower stability = slower, more deliberate delivery
  // Lower similarity_boost = softer, more relaxed tone
  // These settings create a calming, ASMR-like quality with slower pacing
  // Variant 1: Slightly more stable for consistency
  // Variant 2: Slightly less stable for natural prosody variation
  const stability = options.variant === 1 ? 0.35 : 0.3;
  const similarityBoost = options.variant === 1 ? 0.6 : 0.55;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: options.text,
        model_id: "eleven_monolingual_v1", // or "eleven_multilingual_v2" for multi-language
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style: 0.0, // Neutral style for calm affirmations
          use_speaker_boost: false,
        },
        // Slow, meditative speed (0.7-1.2 range, lower = slower)
        speed: 0.75, // Slow, deliberate pace for meditative delivery
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS failed: ${response.status} ${error}`);
  }

  const audioBuffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(audioBuffer));

  // Convert to MP3 with FFmpeg
  await convertToMP3(outputPath);
}

/**
 * Map voiceId to ElevenLabs voice ID
 * Uses free tier default voices for meditative, calming delivery
 */
function mapVoiceIdToElevenLabs(voiceId: string): string {
  // ElevenLabs free tier default voices (meditative, calming, ASMR-like)
  // MALE default: xGDJhCwcqw94ypljc95Z
  // FEMALE default: KGZeK6FsnWQdrkDHnDNA
  const voiceMap: Record<string, string> = {
    "default": "KGZeK6FsnWQdrkDHnDNA", // Female default - free tier
    "male": "xGDJhCwcqw94ypljc95Z", // Male default - free tier
    "female": "KGZeK6FsnWQdrkDHnDNA", // Female default - free tier
    "alloy": "xGDJhCwcqw94ypljc95Z", // Male - calm, steady
    "onyx": "xGDJhCwcqw94ypljc95Z", // Male - strong, confident
    "shimmer": "KGZeK6FsnWQdrkDHnDNA", // Female - gentle, supportive
    "nova": "KGZeK6FsnWQdrkDHnDNA", // Female
    "echo": "xGDJhCwcqw94ypljc95Z", // Male
    "fable": "KGZeK6FsnWQdrkDHnDNA", // Female
  };

  return voiceMap[voiceId.toLowerCase()] || "KGZeK6FsnWQdrkDHnDNA";
}

/**
 * Generate TTS audio using Azure Cognitive Services
 * Azure provides neural voices with SSML support
 */
async function generateAzureTTS(
  options: TTSOptions,
  outputPath: string
): Promise<void> {
  const apiKey = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  
  if (!apiKey || !region) {
    throw new Error("AZURE_SPEECH_KEY and AZURE_SPEECH_REGION must be configured");
  }

  // Get access token
  const tokenResponse = await fetch(
    `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
      },
    }
  );

  if (!tokenResponse.ok) {
    throw new Error(`Azure token request failed: ${tokenResponse.status}`);
  }

  const accessToken = await tokenResponse.text();
  const voice = mapVoiceIdToAzure(options.voiceId);
  
  // Adjust prosody for variant 2
  const prosodyRate = options.variant === 2 ? "1.02" : "1.0"; // Slight speed increase for variation

  // Use SSML for prosody control
  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
      <voice name="${voice}">
        <prosody rate="${prosodyRate}">
          ${options.text}
        </prosody>
      </voice>
    </speak>
  `.trim();

  const response = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
      },
      body: ssml,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Azure TTS failed: ${response.status} ${error}`);
  }

  const audioBuffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(audioBuffer));
  
  // Azure already returns MP3, but ensure it matches V3 profile
  await convertToMP3(outputPath);
}

/**
 * Map voiceId to Azure voice name
 * Use calm, neutral neural voices
 */
function mapVoiceIdToAzure(voiceId: string): string {
  // Azure neural voices (calm, neutral)
  const voiceMap: Record<string, string> = {
    "default": "en-US-AriaNeural", // Calm, neutral female
    "male": "en-US-GuyNeural", // Calm, neutral male
    "female": "en-US-AriaNeural",
  };

  return voiceMap[voiceId.toLowerCase()] || "en-US-AriaNeural";
}

/**
 * Fallback: Generate beep file (original stub implementation)
 * Used when TTS is not configured or fails
 */
async function generateBeepFallback(
  options: TTSOptions,
  outputPath: string
): Promise<void> {
  if (!ffmpegStatic) {
    throw new Error("ffmpeg-static not found");
  }

  // Variant 1 = 440Hz, Variant 2 = 444Hz (Micro-variation simulation)
  const freq = options.variant === 1 ? 440 : 444;
  const durationSec = 1.5;

  await execFileAsync(ffmpegStatic, [
    "-f", "lavfi",
    "-i", `sine=f=${freq}:b=4`,
    "-t", durationSec.toString(),
    "-c:a", "libmp3lame",
    "-b:a", "128k",
    "-ar", "44100",
    "-y",
    outputPath
  ]);
}

/**
 * Convert audio file to MP3 matching V3 audio profile
 * V3 Profile: MP3, 128kbps, 44.1kHz, stereo
 */
async function convertToMP3(inputPath: string): Promise<void> {
  if (!ffmpegStatic) {
    throw new Error("ffmpeg-static not found");
  }

  // If input is already MP3 with correct format, skip conversion
  // Otherwise, convert to match V3 profile
  const tempPath = inputPath.replace(/\.(mp3|wav|m4a)$/, ".temp.mp3");
  
  try {
    await execFileAsync(ffmpegStatic, [
      "-i", inputPath,
      "-c:a", "libmp3lame",
      "-b:a", "128k",
      "-ar", "44100",
      "-ac", "2", // Stereo
      "-y",
      tempPath
    ]);

    // Replace original with converted file
    await fs.move(tempPath, inputPath, { overwrite: true });
  } catch (error) {
    // If conversion fails, try to keep original
    if (await fs.pathExists(tempPath)) {
      await fs.remove(tempPath);
    }
    throw error;
  }
}
