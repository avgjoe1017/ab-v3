export const AUDIO_PROFILE_V3 = {
    CODEC: "mp3",
    BITRATE_KBEPS: 128,
    SAMPLE_RATE_HZ: 44100,
    CHANNELS: 2, // Stereo
    VERSION: "v3_0_0",
} as const;

export const SILENCE_DURATIONS_MS = [
    250,
    500,
    1000,
    1500,
    2000,
    3000,
    4000,
    5000,
    6000,
    7000,
    8000,
    9000,
    10000,
    11000,
    12000,
    13000,
    14000,
    15000,
] as const;

export type AudioProfileV3 = typeof AUDIO_PROFILE_V3;
export type SilenceDurationMs = (typeof SILENCE_DURATIONS_MS)[number];
