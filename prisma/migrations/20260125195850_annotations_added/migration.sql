/*
  Warnings:

  - The values [annotated] on the enum `image_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `annotations` on the `image_metadata` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "image_status_new" AS ENUM ('todo', 'in_progress', 'review', 'rejected', 'completed');
ALTER TABLE "public"."image_metadata" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "image_metadata" ALTER COLUMN "status" TYPE "image_status_new" USING ("status"::text::"image_status_new");
ALTER TYPE "image_status" RENAME TO "image_status_old";
ALTER TYPE "image_status_new" RENAME TO "image_status";
DROP TYPE "public"."image_status_old";
ALTER TABLE "image_metadata" ALTER COLUMN "status" SET DEFAULT 'todo';
COMMIT;

-- DropIndex
DROP INDEX "image_metadata_annotations_idx";

-- AlterTable
ALTER TABLE "image_metadata" DROP COLUMN "annotations",
ADD COLUMN     "blur_hash" TEXT,
ADD COLUMN     "file_size_bytes" INTEGER,
ADD COLUMN     "height" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "reviewed_by_user_id" UUID,
ADD COLUMN     "thumbnail_path" TEXT,
ADD COLUMN     "width" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "annotation" (
    "id" UUID NOT NULL,
    "image_id" UUID NOT NULL,
    "class_id" INTEGER NOT NULL,
    "segmentation" JSONB NOT NULL,
    "bbox" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "annotation_image_id_idx" ON "annotation"("image_id");

-- CreateIndex
CREATE INDEX "annotation_class_id_idx" ON "annotation"("class_id");

-- AddForeignKey
ALTER TABLE "image_metadata" ADD CONSTRAINT "image_metadata_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotation" ADD CONSTRAINT "annotation_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "image_metadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;
