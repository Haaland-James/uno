import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const enums: any = await p.$queryRawUnsafe(`SELECT t.typname FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid GROUP BY t.typname ORDER BY t.typname;`);
  console.log("Enums in DB:", enums.map((e:any)=>e.typname).join(", "));
  await p.$disconnect();
})();
