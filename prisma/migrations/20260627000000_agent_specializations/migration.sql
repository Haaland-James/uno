-- Add AgentSpecialization enum and field to User

CREATE TYPE "AgentSpecialization" AS ENUM ('RENTALS', 'SALES', 'COMMERCIAL');

ALTER TABLE "User" ADD COLUMN "agentSpecializations" "AgentSpecialization"[] NOT NULL DEFAULT '{}';
