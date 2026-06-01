export interface VisualAsset {
  id: string;
  type: "character" | "scene-map" | "key-moment";
  label: string;
  description: string;
  style: "realistic" | "illustrated" | "line-art" | "pixel";
  imageUrl: string | null;
  characterTraits?: string;
  referenceImageUrl?: string;
  createdAt: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  assets: VisualAsset[];
  createdAt: number;
}

export type AssetType = VisualAsset["type"];
export type ImageStyle = VisualAsset["style"];
