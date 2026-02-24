import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

export class AudioFileService {
  private audioDir: string;

  constructor() {
    this.audioDir = path.join(app.getPath('userData'), 'audio');
  }

  /**
   * Initialize the audio directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.access(this.audioDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(this.audioDir, { recursive: true });
      console.log('Created audio directory:', this.audioDir);
    }
  }

  /**
   * Generate a unique audio file ID
   */
  generateAudioId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Copy an audio file to the app's audio directory
   * @param sourcePath - Path to the source audio file
   * @returns Object with the new file ID and internal path
   */
  async copyAudioFile(sourcePath: string): Promise<{id: string, internalPath: string}> {
    await this.initialize();
    
    // Validate that the file exists
    try {
      await fs.access(sourcePath);
    } catch (error) {
      throw new Error(`Audio file not found: ${sourcePath}`);
    }

    // Validate audio file format
    const isValidAudio = await this.validateAudioFile(sourcePath);
    if (!isValidAudio) {
      throw new Error(`Invalid audio file format: ${sourcePath}`);
    }

    // Generate unique ID and get file extension
    const audioId = this.generateAudioId();
    const fileExt = path.extname(sourcePath).toLowerCase();
    const internalFileName = `${audioId}${fileExt}`;
    const internalPath = path.join(this.audioDir, internalFileName);

    // Copy the file
    await fs.copyFile(sourcePath, internalPath);
    
    console.log(`Copied audio file: ${sourcePath} -> ${internalPath}`);
    return { id: audioId, internalPath: internalFileName }; // Return relative path for storage
  }

  /**
   * Delete an audio file from the app's audio directory
   * @param audioFileName - The internal filename (e.g., "123456_abc123.mp3")
   */
  async deleteAudioFile(audioFileName: string): Promise<void> {
    const fullPath = path.join(this.audioDir, audioFileName);
    
    try {
      await fs.unlink(fullPath);
      console.log(`Deleted audio file: ${fullPath}`);
    } catch (error) {
      // File might already be deleted or not exist
      console.warn(`Could not delete audio file: ${fullPath}`, error);
    }
  }

  /**
   * Validate that a file is a supported audio format
   * @param filePath - Path to the file to validate
   * @returns true if the file is a valid audio file
   */
  async validateAudioFile(filePath: string): Promise<boolean> {
    const supportedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Check extension
    if (!supportedExtensions.includes(fileExt)) {
      return false;
    }

    // Check if file exists and is readable
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile() && stats.size > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the MIME type for an audio file
   * @param filePath - Path to the audio file
   * @returns MIME type string
   */
  getAudioMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac'
    };
    
    return mimeTypes[ext] || 'audio/mpeg';
  }

  /**
   * Get the full path to an audio file in the app's audio directory
   * @param audioFileName - The internal filename
   * @returns Full path to the audio file
   */
  getAudioFilePath(audioFileName: string): string {
    return path.join(this.audioDir, audioFileName);
  }

  /**
   * Check if an audio file exists in the app's audio directory
   * @param audioFileName - The internal filename
   * @returns true if the file exists
   */
  async audioFileExists(audioFileName: string): Promise<boolean> {
    try {
      const fullPath = this.getAudioFilePath(audioFileName);
      await fs.access(fullPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the audio directory path
   */
  getAudioDirectory(): string {
    return this.audioDir;
  }
}

// Export a singleton instance
export const audioFileService = new AudioFileService();


