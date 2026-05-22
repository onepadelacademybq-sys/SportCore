-- Add document_id and address fields to profiles table
ALTER TABLE "profiles" ADD COLUMN "document_id" TEXT;
ALTER TABLE "profiles" ADD COLUMN "address" TEXT;
