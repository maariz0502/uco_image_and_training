// src/types/image.ts

// TODO: DELETE THIS FILE - we should just use the types from app/types.ts for consistency. This was an early experiment that got replaced by the more comprehensive VisionImage type in app/types.ts

// 1. Match the Prisma Enum exactly
export type ImageStatus = 'todo' | 'in_progress' | 'review' | 'rejected' | 'completed';

// 2. The Polygon Structure (Frontend friendly)
export interface PolygonAnnotation {
  id: string;
  classId: number; 
  label: string;
  points: number[]; 
}

export interface VisionImage {
  id: string;
  url: string;       
  thumbnail?: string; 
  name: string;
  status: ImageStatus;
  
  width: number;
  height: number;

  uploader?: string;
  annotator?: string;
  reviewer?: string;
  rejectionReason?: string | null;


  objects: string[]; 
  polygons: PolygonAnnotation[];
  
  createdAt: Date;
}