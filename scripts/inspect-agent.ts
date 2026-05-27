import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

db.user
	.findUnique({
		where: { agentSlug: "emem-akpan" },
		select: {
			id: true,
			name: true,
			agentStatus: true,
			agentEmployment: true,
			agentSlug: true,
			agentBio: true,
			agentPhoto: true,
			photo: true,
			agentTerritory: true,
		},
	})
	.then((u) => {
		console.log(JSON.stringify(u, null, 2));
		return db.$disconnect();
	});
