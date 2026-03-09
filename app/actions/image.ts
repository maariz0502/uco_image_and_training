"use server";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

function isImageFile(file: File) {
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(file.type)) return false;
  return true;
}

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function getImages() {
  try {
    const images = await prisma.imageMetadata.findMany({
      orderBy: {
        createdAt: "desc", // Show newest uploads at the top
      },
    });
    return { success: true, images };
  } catch (error) {
    console.error("Fetch Error:", error);
    return { success: false, images: [] };
  }
}

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file || !isImageFile(file)) {
      return {
        success: false,
        error: "Invalid file type. Only images allowed.",
      };
    }

    // 1. Prepare file for S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFilename = `${Date.now()}-${cleanName}`;

    // 2. Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: uniqueFilename,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    // 3. Construct the CloudFront URL
    const cloudFrontUrl = `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/${uniqueFilename}`;

    // 4. Save Metadata to DB
    const newImage = await prisma.imageMetadata.create({
      data: {
        filename: file.name,
        s3Path: cloudFrontUrl,
        status: "todo",
        width: 0,
        height: 0,
      },
    });

    revalidatePath("/dataset");
    return { success: true, image: newImage };
  } catch (error) {
    console.error("Upload Error:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

export async function deleteImage(imageId: string) {
  try {
    // Get the image from DB to find the filename
    const image = await prisma.imageMetadata.findUnique({
      where: { id: imageId },
    });

    if (!image) return { success: false, error: "Image not found" };

    // Extract Key from URL
    const fileKey = image.s3Path.split("/").pop();

    if (fileKey) {
      // 3. Delete from S3
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
        }),
      );
    }

    // Delete from DB
    await prisma.imageMetadata.delete({
      where: { id: imageId },
    });

    revalidatePath("/dataset");
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: "Failed to delete image" };
  }
}

// Handle batch uploads with COCO JSON and manual tags
export async function uploadBatch(formData: FormData) {
  try {
    const files = formData.getAll("images") as File[];
    const cocoFiles = formData.getAll("cocoJsons") as File[];
    const manualTagsStr = formData.get("manualTags") as string;

    if (!files || files.length === 0) {
      return { success: false, error: "No images provided." };
    }

    const baseTags: string[] = manualTagsStr ? JSON.parse(manualTagsStr) : [];

    // Map: filename -> { categories: ["red_light", "yellow_light", ...], annotations: [Raw COCO JSON array] }
    const cocoMap = new Map<
      string,
      { categories: string[]; annotations: any[] }
    >();

    // Loop through every attached COCO file
    for (const cocoFile of cocoFiles) {
      const cocoText = await cocoFile.text();
      const coco = JSON.parse(cocoText);

      // 1. Sort the categories by ID, then extract just the names into an array of strings
      const orderedCategoryNames: string[] = (coco.categories || [])
        .sort((a: any, b: any) => a.id - b.id)
        .map((c: any) => c.name);

      const imagesMap = new Map(
        coco.images?.map((i: any) => [i.id, i.file_name]) || [],
      );

      // 2. Map annotations and our new string array to the exact filename
      if (coco.annotations) {
        for (const ann of coco.annotations) {
          const fileName = imagesMap.get(ann.image_id) as string | undefined;

          if (fileName) {
            if (!cocoMap.has(fileName)) {
              // Store the ordered array of names for this image
              cocoMap.set(fileName, {
                categories: orderedCategoryNames,
                annotations: [],
              });
            }
            // Add the annotation
            cocoMap.get(fileName)!.annotations.push(ann);
          }
        }
      }
    }

    // Process each image sequentially
    const uploadedImages = [];

    for (const file of files) {
      if (!isImageFile(file)) continue; // Skip non-images

      // Prepare S3 payload
      const buffer = Buffer.from(await file.arrayBuffer());
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const uniqueFilename = `${Date.now()}-${cleanName}`;

      // Upload to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: uniqueFilename,
          Body: buffer,
          ContentType: file.type,
        }),
      );

      const cloudFrontUrl = `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/${uniqueFilename}`;

      // Look up COCO data based on the exact original filename
      const fileCocoData = cocoMap.get(file.name);

      // Save to Prisma
      const newImage = await prisma.imageMetadata.create({
        data: {
          filename: file.name,
          s3Path: cloudFrontUrl,
          status: "todo",
          width: 0,
          height: 0,
          tags: baseTags,
          categories: fileCocoData ? fileCocoData.categories : [],
          cocoData: fileCocoData ? fileCocoData.annotations : [],
        },
      });

      uploadedImages.push(newImage);
    }

    revalidatePath("/dataset");
    return { success: true, count: uploadedImages.length };
  } catch (error) {
    console.error("Batch Upload Error:", error);
    return { success: false, error: "Failed to process batch upload." };
  }
}
