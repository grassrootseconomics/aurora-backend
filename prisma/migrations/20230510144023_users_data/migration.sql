-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT,
    "walletAddress" TEXT NOT NULL,
    "idRole" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nonce" (
    "id" SERIAL NOT NULL,
    "substance" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "idUser" INTEGER NOT NULL,

    CONSTRAINT "Nonce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Nonce_idUser_key" ON "Nonce"("idUser");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_idRole_fkey" FOREIGN KEY ("idRole") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nonce" ADD CONSTRAINT "Nonce_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
