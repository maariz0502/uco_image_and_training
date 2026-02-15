export type ImageStatus = "annotated" | "todo" | "review";

// export interface BoundingBox {
//   id: string;
//   label: string;
//   x: number; // Percentage (0-100) is usually better for responsive images
//   y: number;
//   w: number;
//   h: number;
// }

export interface VisionImage {
  id: string;
  url: string;
  name: string;
  status: "annotated" | "todo" | "review";
  uploader?: string;
  objects: string[];
  annotations: string;
  created_at: Date;
}

// export const mockImages: VisionImage[] = [
//     { 
//     id: "2", 
//     url: "https://picsum.photos/seed/2/800/600", 
//     name: "Urban Street", 
//     status: "annotated", 
//     objects: ["car", "traffic light"], 
//     uploader: "Alice",
//     boxes: [
//       { id: "b1", label: "car", x: 10, y: 40, w: 30, h: 25 },
//       { id: "b2", label: "traffic light", x: 60, y: 10, w: 10, h: 40 }
//     ],
//     created_at: new Date(2025, 0, 20)
//   },
//   { 
//     id: "1", url: "https://picsum.photos/seed/1/800/600", name: "Drone Shot 1", status: "todo", 
//     objects: [], uploader: "Alice", created_at: new Date(2025, 0, 20)
//   },
//   { 
//     id: "3", url: "https://picsum.photos/seed/3/800/600", name: "Park Surveillance", status: "review", 
//     objects: ["person", "dog", "bench"], uploader: "Bob", created_at: new Date(2025, 0, 20)
//   },
//   { 
//     id: "4", url: "https://picsum.photos/seed/4/800/600", name: "Highway 1", status: "todo", 
//     objects: [], uploader: "Bob", created_at: new Date(2025, 0, 20)
//   },
//   { 
//     id: "5", url: "https://picsum.photos/seed/5/800/600", name: "Highway 2", status: "annotated", 
//     objects: ["truck", "car"], uploader: "Alice", created_at: new Date(2025, 0, 20)
//   },
// ];