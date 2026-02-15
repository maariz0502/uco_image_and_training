export type ImageStatus = "todo" | "in_progress" | "review" | "rejected" | "completed";

export enum UserRole {
  admin = "admin",
  annotator = "annotator",
  reviewer = "reviewer",
  uploader = "uploader",
  guest = "guest",
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: UserRole[];
  createdAt: string; 
}

export interface GalleryImage {
  id: string;
  filename: string;
  s3Path: string; 
  status: ImageStatus; 
  width: number;
  height: number;
  
  thumbnailPath?: string;     //@map("thumbnail_path")
  blurHash?: string;          //@map("blur_hash")
  fileSizeBytes?: number;     //@map("file_size_bytes")

  uploadedByUserId?:string;   //@map("uploaded_by_user_id") @db.Uuid
  uploadedBy?: User;   
  annotatedByUserId?: string;  //@map("annotated_by_user_id") @db.Uuid
  annotatedBy?: User;   

  reviewedByUserId?: string;    //@map("reviewed_by_user_id") @db.Uuid
  reviewedBy?: User;   

  rejectionReason?: string;     //@map("rejection_reason")

  // annotations: Annotation[]

  cvat_task_id?: number;      // or "cvat_task_id"
  
  createdAt: Date;
  updatedAt?: Date;
}