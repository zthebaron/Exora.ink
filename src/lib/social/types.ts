/**
 * Shared types for the social poster.
 *
 * Platform IDs are kept as plain strings so we can grow the list (Threads,
 * X, TikTok, YouTube) without enum migrations. Validation lives in the
 * publish-side adapters per platform.
 */

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "pinterest"
  | "threads"
  | "x"
  | "tiktok";

export type PostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "cancelled";

export type PostResultStatus = "queued" | "publishing" | "ok" | "error";

export interface SocialAccountDTO {
  id: string;
  platform: SocialPlatform;
  externalId: string;
  displayName: string;
  avatarUrl: string | null;
  expiresAt: string | null;
  scope: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPostDTO {
  id: string;
  label: string | null;
  body: string;
  imageUrls: string[];
  targetAccountIds: string[];
  status: PostStatus;
  scheduledFor: string | null;
  postedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  results?: PostResultDTO[];
}

export interface PostResultDTO {
  id: string;
  accountId: string;
  status: PostResultStatus;
  platformPostId: string | null;
  permalink: string | null;
  error: string | null;
  metrics: Record<string, unknown> | null;
  attemptedAt: string;
}

export interface PlatformInfo {
  id: SocialPlatform;
  label: string;
  /** Lucide icon name. */
  icon: "Facebook" | "Instagram" | "Linkedin" | "Image" | "Sparkles";
  accent: "sky" | "rose" | "indigo" | "emerald" | "amber" | "teal";
  /** Hard cap on body characters (where Twitter has the lowest at 280). */
  maxBodyChars: number;
  /** Whether the platform requires an image to publish. */
  imageRequired: boolean;
  /** Whether we've shipped the integration. */
  available: boolean;
}

export const PLATFORMS: Record<SocialPlatform, PlatformInfo> = {
  facebook: {
    id: "facebook",
    label: "Facebook Page",
    icon: "Facebook",
    accent: "sky",
    maxBodyChars: 63206,
    imageRequired: false,
    available: false, // flips true after Meta auth ships
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    icon: "Instagram",
    accent: "rose",
    maxBodyChars: 2200,
    imageRequired: true,
    available: false,
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    icon: "Linkedin",
    accent: "indigo",
    maxBodyChars: 3000,
    imageRequired: false,
    available: false,
  },
  pinterest: {
    id: "pinterest",
    label: "Pinterest",
    icon: "Image",
    accent: "rose",
    maxBodyChars: 500,
    imageRequired: true,
    available: false,
  },
  threads: {
    id: "threads",
    label: "Threads",
    icon: "Sparkles",
    accent: "teal",
    maxBodyChars: 500,
    imageRequired: false,
    available: false,
  },
  x: {
    id: "x",
    label: "X / Twitter",
    icon: "Sparkles",
    accent: "amber",
    maxBodyChars: 280,
    imageRequired: false,
    available: false,
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    icon: "Sparkles",
    accent: "emerald",
    maxBodyChars: 2200,
    imageRequired: true,
    available: false,
  },
};
