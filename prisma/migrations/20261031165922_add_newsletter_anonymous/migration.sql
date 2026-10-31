-- CreateTable
CREATE TABLE "NewsletterAnonymous" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterAnonymous_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterAnonymous_email_key" ON "NewsletterAnonymous"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterAnonymous_token_key" ON "NewsletterAnonymous"("token");
