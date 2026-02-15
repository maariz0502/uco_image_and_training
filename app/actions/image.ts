"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

function isImageFile(file: File) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
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
        createdAt: 'desc', // Show newest uploads at the top
      },
    });
    return { success: true, images };
  } catch (error) {
    console.error("Fetch Error:", error);
    // Return empty array on error so the UI doesn't crash
    return { success: false, images: [] };
  }
}

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file || !isImageFile(file)) {
        return { success: false, error: "Invalid file type. Only images allowed." };
    }

    // 1. Prepare file for S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFilename = `${Date.now()}-${cleanName}`;

    // 2. Upload to S3
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: uniqueFilename,
      Body: buffer,
      ContentType: file.type, // e.g. "image/png"
    }));

    // 3. Construct the CloudFront URL
    const cloudFrontUrl = `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/${uniqueFilename}`;

    // 4. Save Metadata to DB
    const newImage = await prisma.imageMetadata.create({
      data: {
        filename: file.name,     // Original name for display
        s3Path: cloudFrontUrl,   // The CDN URL
        status: "todo",
        width: 0, // Ideally you'd use a library like 'sharp' to get dimensions, but skipping for now
        height: 0,
      },
    });

    revalidatePath("/gallery");
    return { success: true, image: newImage };

  } catch (error) {
    console.error("Upload Error:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

export async function deleteImage(imageId: string) {
  try {
    // 1. Get the image from DB to find the filename
    const image = await prisma.imageMetadata.findUnique({
      where: { id: imageId },
    });

    if (!image) return { success: false, error: "Image not found" };

    // 2. Extract Key from URL
    const fileKey = image.s3Path.split("/").pop();

    if (fileKey) {
        // 3. Delete from S3
        await s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
        }));
    }

    // 4. Delete from DB
    await prisma.imageMetadata.delete({
      where: { id: imageId },
    });

    revalidatePath("/gallery");
    return { success: true };

  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: "Failed to delete image" };
  }
}