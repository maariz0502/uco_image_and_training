// app/actions/training.ts
"use server";

import prisma from "@/lib/db";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 Client using your exact configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function compileCocoAction(imageIds: string[], userId: string) {
  if (!imageIds || imageIds.length === 0) {
    return { success: false, error: "No images provided for training." };
  }

  try {
    const imagesData = await prisma.imageMetadata.findMany({
      where: { id: { in: imageIds } },
    });

    const coco = {
      info: {
        description: "Custom YOLOv8 Training Dataset",
        version: "1.0",
        year: new Date().getFullYear(),
        date_created: new Date().toISOString(),
      },
      images: [] as any[],
      annotations: [] as any[],
      categories: [] as any[],
    };

    const categoryMap = new Map<string, number>();
    let categoryCounter = 1;
    let annotationCounter = 1;

    // 3. Loop through the database records and build the COCO objects
    imagesData.forEach((dbImg, index) => {
      const cocoImageId = index + 1; // COCO requires sequential integer IDs

      // Add to COCO images array
      coco.images.push({
        id: cocoImageId,
        file_name: dbImg.filename,
        width: dbImg.width || 640,
        height: dbImg.height || 640,
      });

      // --- NEW: Read categories directly from your Prisma String[] column ---
      if (dbImg.categories && Array.isArray(dbImg.categories)) {
        dbImg.categories.forEach((categoryName) => {
          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, categoryCounter);
            coco.categories.push({
              id: categoryCounter,
              name: categoryName,
              supercategory: "none",
            });
            categoryCounter++;
          }
        });
      }

      // 4. Safely parse the annotations from the Json field
      if (dbImg.cocoData) {
        const data = dbImg.cocoData as any;
        // Since your batch upload saves just the array of annotations directly:
        const annotations = Array.isArray(data) ? data : data.annotations || [];

        // 5. Merge Annotations
        annotations.forEach((ann: any) => {
          let categoryId = ann.category_id;

          // If your annotation JSON has a string label, map it to our global integer ID
          const labelName = ann.label || ann.name || ann.category_name;

          if (labelName) {
            // Safety check: just in case a label exists here but wasn't in the categories array
            if (!categoryMap.has(labelName)) {
              categoryMap.set(labelName, categoryCounter);
              coco.categories.push({
                id: categoryCounter,
                name: labelName,
                supercategory: "none",
              });
              categoryCounter++;
            }
            categoryId = categoryMap.get(labelName);
          } else if (categoryId && dbImg.categories[categoryId - 1]) {
            // Fallback: If the annotation ONLY has an integer ID, try to look up its string
            // name from the image's categories array (assuming 1-indexed COCO IDs)
            const mappedName = dbImg.categories[categoryId - 1];
            if (categoryMap.has(mappedName)) {
              categoryId = categoryMap.get(mappedName);
            }
          }

          coco.annotations.push({
            ...ann,
            id: annotationCounter++, // Overwrite with our unified sequential ID
            image_id: cocoImageId, // Link to the unified integer image ID
            category_id: categoryId || 1, // Final fallback
          });
        });
      }
    });

    // --- S3 Upload Logic ---
    const jobId = crypto.randomUUID();
    const jsonString = JSON.stringify(coco);
    const buffer = Buffer.from(jsonString, "utf-8");
    const s3Key = `training-jobs/${jobId}/annotations.json`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: "application/json",
      }),
    );

    // Save the Job to the Database
    await prisma.trainingJob.create({
      data: {
        id: jobId,
        userId: userId,
        status: "queued",
        s3DatasetPath: s3Key,
      },
    });

    // 5. Trigger your Python webhook (Commented out until your Python server is up)
    /*
    const response = await fetch("https://your-python-gpu-server.com/api/start-training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: jobId,
        coco_json_key: s3Key, 
      })
    });
    */

    return {
      success: true,
      jobId: jobId,
      message: "Dataset compiled and uploaded successfully to S3!",
    };
  } catch (error) {
    console.error("Failed to compile COCO dataset:", error);
    return {
      success: false,
      error: "Failed to compile dataset due to a server error.",
    };
  }
}
