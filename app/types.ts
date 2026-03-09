export type ImageStatus = "todo" | "in_progress" | "review" | "rejected" | "completed";

export enum UserRole {
  admin = "admin",
  annotator = "annotator",
  reviewer = "reviewer",
  uploader = "uploader",
  guest = "guest",
}