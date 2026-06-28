-- CreateTable
CREATE TABLE "MarketCache" (
    "coingeckoId" TEXT NOT NULL PRIMARY KEY,
    "rank" INTEGER,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "currentPrice" REAL,
    "marketCap" REAL,
    "fdv" REAL,
    "totalVolume" REAL,
    "circulatingSupply" REAL,
    "totalSupply" REAL,
    "maxSupply" REAL,
    "ath" REAL,
    "athChangePercentage" REAL,
    "pc1h" REAL,
    "pc24h" REAL,
    "pc7d" REAL,
    "pc14d" REAL,
    "pc30d" REAL,
    "pc200d" REAL,
    "pc1y" REAL,
    "fetchedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DetailCache" (
    "coingeckoId" TEXT NOT NULL PRIMARY KEY,
    "genesisDate" TEXT,
    "categories" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CategoryList" (
    "categoryId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT,
    "status" TEXT NOT NULL,
    "universeSize" INTEGER NOT NULL,
    "logic" TEXT NOT NULL,
    "conditions" TEXT NOT NULL,
    "resultColumns" TEXT,
    "stage" TEXT,
    "progressCurrent" INTEGER NOT NULL DEFAULT 0,
    "progressTotal" INTEGER NOT NULL DEFAULT 0,
    "etaSeconds" INTEGER,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "results" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "finishedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "MarketCache_rank_idx" ON "MarketCache"("rank");

-- CreateIndex
CREATE INDEX "MarketCache_fetchedAt_idx" ON "MarketCache"("fetchedAt");

-- CreateIndex
CREATE INDEX "DetailCache_fetchedAt_idx" ON "DetailCache"("fetchedAt");

-- CreateIndex
CREATE INDEX "Scan_status_idx" ON "Scan"("status");

-- CreateIndex
CREATE INDEX "Scan_createdAt_idx" ON "Scan"("createdAt");
