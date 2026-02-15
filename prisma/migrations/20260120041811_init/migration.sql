-- CreateEnum
CREATE TYPE "image_status" AS ENUM ('todo', 'review', 'annotated');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_metadata" (
    "id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "s3_path" TEXT NOT NULL,
    "status" "image_status" NOT NULL DEFAULT 'todo',
    "uploaded_by_user_id" UUID,
    "annotated_by_user_id" UUID,
    "annotations" JSONB NOT NULL DEFAULT '{}',
    "cvat_task_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "image_metadata_s3_path_key" ON "image_metadata"("s3_path");

-- CreateIndex
CREATE INDEX "image_metadata_status_idx" ON "image_metadata"("status");

-- CreateIndex
CREATE INDEX "image_metadata_uploaded_by_user_id_idx" ON "image_metadata"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "image_metadata_annotated_by_user_id_idx" ON "image_metadata"("annotated_by_user_id");

-- CreateIndex
CREATE INDEX "image_metadata_annotations_idx" ON "image_metadata" USING GIN ("annotations");

-- AddForeignKey
ALTER TABLE "image_metadata" ADD CONSTRAINT "image_metadata_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_metadata" ADD CONSTRAINT "image_metadata_annotated_by_user_id_fkey" FOREIGN KEY ("annotated_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
