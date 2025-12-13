import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegStatic from "ffmpeg-static";
import fs from "fs-extra";
import path from "path";
import { TEMP_DIR, MERGED_DIR } from "./constants";

const execFileAsync = promisify(execFile);

export async function stitchAudioFiles(
    filePaths: string[],
    outputId: string
): Promise<string> {
    if (!ffmpegStatic) throw new Error("ffmpeg-static not found");

    await fs.ensureDir(TEMP_DIR);
    await fs.ensureDir(MERGED_DIR);

    const outputPath = path.join(MERGED_DIR, `${outputId}.mp3`);

    // Create a concat list file
    const listFileName = `list-${outputId}.txt`;
    const listFilePath = path.join(TEMP_DIR, listFileName);

    const fileContent = filePaths
        .map((p) => {
            const relPath = path.relative(TEMP_DIR, p);
            return `file '${relPath.replace(/\\/g, "/")}'`;
        })
        .join("\n");

    console.log("FFmpeg Concat List Content:\n", fileContent); // Debug
    await fs.writeFile(listFilePath, fileContent);

    try {
        await execFileAsync(ffmpegStatic, [
            "-f", "concat",
            "-safe", "0",
            "-i", listFilePath,
            "-c", "copy",
            "-y", // Overwrite
            outputPath
        ]);

        // Cleanup list file
        await fs.remove(listFilePath).catch(console.error);
        return outputPath;
    } catch (err) {
        console.error("FFmpeg stitching error:", err);
        throw err;
    }
}
