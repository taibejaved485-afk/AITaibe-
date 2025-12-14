export interface EditedVersion {
  id: string;
  url: string; // Base64 data URL
  prompt: string;
  timestamp: number;
}

export interface ImageItem {
  id: string;
  originalUrl: string; // Base64 data URL
  currentUrl: string; // Base64 data URL (active version)
  name: string;
  versions: EditedVersion[];
  isProcessing: boolean;
}

export type EditRequestParams = {
  imageBase64: string;
  prompt: string;
  preserveFaces: boolean;
};
