-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "locked" TIMESTAMP(3),
    "team" TEXT,
    "player" TEXT,
    "salary" INTEGER NOT NULL,
    "years" INTEGER NOT NULL,
    "bid_order" INTEGER,
    "eval_order" INTEGER,
    "is_dts" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "salary" INTEGER NOT NULL,
    "years" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "team" TEXT,
    "player" TEXT,
    "needsAttention" BOOLEAN NOT NULL DEFAULT false,
    "isFranchiseTagged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractLogEntry" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "contract" TEXT,
    "player" TEXT,
    "team" TEXT,
    "user" TEXT,
    "message" TEXT NOT NULL DEFAULT '',
    "oldValues" JSONB,
    "newValues" JSONB,

    CONSTRAINT "ContractLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftPick" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "team" TEXT,
    "owner" TEXT,
    "player" TEXT,

    CONSTRAINT "DraftPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "espn_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "age" INTEGER,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "debutYear" INTEGER,
    "draftYear" INTEGER,
    "draftRound" INTEGER,
    "draftSelection" INTEGER,
    "team" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT '',
    "positionWeight" INTEGER,
    "isIrEligible" BOOLEAN NOT NULL DEFAULT false,
    "injuryStatus" TEXT NOT NULL DEFAULT '',
    "positionRank" INTEGER,
    "overallRank" INTEGER,
    "positionRankProj" INTEGER,
    "overallRankProj" INTEGER,
    "seasonOutlook" TEXT,
    "outlooksByWeek" JSONB,
    "isRookie" BOOLEAN NOT NULL DEFAULT false,
    "fullStats" JSONB,
    "pointsLastYear" DOUBLE PRECISION,
    "pointsThisYear" DOUBLE PRECISION,
    "pointsThisYearProj" DOUBLE PRECISION,
    "pointsThisWeekProj" DOUBLE PRECISION,
    "splits" JSONB,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "espn_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "logo" TEXT NOT NULL DEFAULT '',
    "abbreviation" TEXT NOT NULL DEFAULT '',
    "projectedRank" INTEGER,
    "playoffSeed" INTEGER,
    "rankCalculatedFinal" INTEGER,
    "wins" INTEGER,
    "losses" INTEGER,
    "ties" INTEGER,
    "pointsFor" DOUBLE PRECISION,
    "pointsAgainst" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "gamesBack" DOUBLE PRECISION,
    "streakLength" INTEGER,
    "streakType" TEXT NOT NULL DEFAULT '',
    "owner" TEXT,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "teamOne" TEXT,
    "teamOneApproves" BOOLEAN NOT NULL DEFAULT false,
    "teamTwo" TEXT,
    "teamTwoApproves" BOOLEAN NOT NULL DEFAULT false,
    "teamsAgree" TIMESTAMP(3),
    "tradeFinalized" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isOwner" BOOLEAN NOT NULL DEFAULT true,
    "passwordResetToken" TEXT,
    "passwordResetIssuedAt" TIMESTAMP(3),
    "passwordResetRedeemedAt" TIMESTAMP(3),
    "magicAuthToken" TEXT,
    "magicAuthIssuedAt" TIMESTAMP(3),
    "magicAuthRedeemedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueSetting" (
    "id" INTEGER NOT NULL,
    "season" INTEGER,
    "phase" TEXT,
    "draft_order" JSONB,
    "rfa_order" JSONB,
    "on_the_clock" TEXT,
    "bid_deadlines" JSONB,
    "ft_prices" JSONB,

    CONSTRAINT "LeagueSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Trade_teamOneContracts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Trade_teamTwoContracts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Trade_teamOneDraftPicks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Trade_teamTwoDraftPicks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Bid_team_idx" ON "Bid"("team");

-- CreateIndex
CREATE INDEX "Bid_player_idx" ON "Bid"("player");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_player_key" ON "Contract"("player");

-- CreateIndex
CREATE INDEX "Contract_salary_idx" ON "Contract"("salary");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_team_idx" ON "Contract"("team");

-- CreateIndex
CREATE INDEX "ContractLogEntry_contract_idx" ON "ContractLogEntry"("contract");

-- CreateIndex
CREATE INDEX "ContractLogEntry_player_idx" ON "ContractLogEntry"("player");

-- CreateIndex
CREATE INDEX "ContractLogEntry_team_idx" ON "ContractLogEntry"("team");

-- CreateIndex
CREATE INDEX "ContractLogEntry_user_idx" ON "ContractLogEntry"("user");

-- CreateIndex
CREATE INDEX "DraftPick_team_idx" ON "DraftPick"("team");

-- CreateIndex
CREATE INDEX "DraftPick_owner_idx" ON "DraftPick"("owner");

-- CreateIndex
CREATE INDEX "DraftPick_player_idx" ON "DraftPick"("player");

-- CreateIndex
CREATE UNIQUE INDEX "Player_espn_id_key" ON "Player"("espn_id");

-- CreateIndex
CREATE INDEX "Player_name_idx" ON "Player"("name");

-- CreateIndex
CREATE INDEX "Player_position_idx" ON "Player"("position");

-- CreateIndex
CREATE INDEX "Player_injuryStatus_idx" ON "Player"("injuryStatus");

-- CreateIndex
CREATE INDEX "Player_pointsLastYear_idx" ON "Player"("pointsLastYear");

-- CreateIndex
CREATE INDEX "Player_pointsThisYear_idx" ON "Player"("pointsThisYear");

-- CreateIndex
CREATE INDEX "Player_pointsThisYearProj_idx" ON "Player"("pointsThisYearProj");

-- CreateIndex
CREATE INDEX "Player_pointsThisWeekProj_idx" ON "Player"("pointsThisWeekProj");

-- CreateIndex
CREATE UNIQUE INDEX "Team_espn_id_key" ON "Team"("espn_id");

-- CreateIndex
CREATE UNIQUE INDEX "Team_abbreviation_key" ON "Team"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Team_owner_key" ON "Team"("owner");

-- CreateIndex
CREATE INDEX "Trade_teamOne_idx" ON "Trade"("teamOne");

-- CreateIndex
CREATE INDEX "Trade_teamTwo_idx" ON "Trade"("teamTwo");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "LeagueSetting_on_the_clock_idx" ON "LeagueSetting"("on_the_clock");

-- CreateIndex
CREATE UNIQUE INDEX "_Trade_teamOneContracts_AB_unique" ON "_Trade_teamOneContracts"("A", "B");

-- CreateIndex
CREATE INDEX "_Trade_teamOneContracts_B_index" ON "_Trade_teamOneContracts"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Trade_teamTwoContracts_AB_unique" ON "_Trade_teamTwoContracts"("A", "B");

-- CreateIndex
CREATE INDEX "_Trade_teamTwoContracts_B_index" ON "_Trade_teamTwoContracts"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Trade_teamOneDraftPicks_AB_unique" ON "_Trade_teamOneDraftPicks"("A", "B");

-- CreateIndex
CREATE INDEX "_Trade_teamOneDraftPicks_B_index" ON "_Trade_teamOneDraftPicks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Trade_teamTwoDraftPicks_AB_unique" ON "_Trade_teamTwoDraftPicks"("A", "B");

-- CreateIndex
CREATE INDEX "_Trade_teamTwoDraftPicks_B_index" ON "_Trade_teamTwoDraftPicks"("B");

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_team_fkey" FOREIGN KEY ("team") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_player_fkey" FOREIGN KEY ("player") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_team_fkey" FOREIGN KEY ("team") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_player_fkey" FOREIGN KEY ("player") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractLogEntry" ADD CONSTRAINT "ContractLogEntry_contract_fkey" FOREIGN KEY ("contract") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractLogEntry" ADD CONSTRAINT "ContractLogEntry_player_fkey" FOREIGN KEY ("player") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractLogEntry" ADD CONSTRAINT "ContractLogEntry_team_fkey" FOREIGN KEY ("team") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractLogEntry" ADD CONSTRAINT "ContractLogEntry_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_team_fkey" FOREIGN KEY ("team") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_owner_fkey" FOREIGN KEY ("owner") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_player_fkey" FOREIGN KEY ("player") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_owner_fkey" FOREIGN KEY ("owner") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_teamOne_fkey" FOREIGN KEY ("teamOne") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_teamTwo_fkey" FOREIGN KEY ("teamTwo") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueSetting" ADD CONSTRAINT "LeagueSetting_on_the_clock_fkey" FOREIGN KEY ("on_the_clock") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Trade_teamOneContracts" ADD CONSTRAINT "_Trade_teamOneContracts_A_fkey" FOREIGN KEY ("A") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Trade_teamOneContracts" ADD CONSTRAINT "_Trade_teamOneContracts_B_fkey" FOREIGN KEY ("B") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Trade_teamTwoContracts" ADD CONSTRAINT "_Trade_teamTwoContracts_A_fkey" FOREIGN KEY ("A") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Trade_teamTwoContracts" ADD CONSTRAINT "_Trade_teamTwoContracts_B_fkey" FOREIGN KEY ("B") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Trade_teamOneDraftPicks" ADD CONSTRAINT "_Trade_teamOneDraftPicks_A_fkey" FOREIGN KEY ("A") REFERENCES "DraftPick"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Trade_teamOneDraftPicks" ADD CONSTRAINT "_Trade_teamOneDraftPicks_B_fkey" FOREIGN KEY ("B") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Trade_teamTwoDraftPicks" ADD CONSTRAINT "_Trade_teamTwoDraftPicks_A_fkey" FOREIGN KEY ("A") REFERENCES "DraftPick"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Trade_teamTwoDraftPicks" ADD CONSTRAINT "_Trade_teamTwoDraftPicks_B_fkey" FOREIGN KEY ("B") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
