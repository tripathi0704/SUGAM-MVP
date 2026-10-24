import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { email: true, name: true, primaryRole: true, bureau: true } });
  console.log(`Found ${users.length} users:`);
  users.forEach(u => console.log(` - ${u.email} (${u.name}, ${u.primaryRole}, bureau: ${u.bureau || 'none'})`));
  const institutions = await prisma.institution.findMany({ select: { code: true, name: true, permanentId: true, region: true } });
  console.log(`Found ${institutions.length} institutions:`);
  institutions.forEach(i => console.log(` - ${i.code} [PID: ${i.permanentId}] ${i.name} (Region: ${i.region})`));
  const cases = await prisma.case.findMany({ select: { caseNumber: true, subject: true, bureau: true, overlapFlag: true } });
  console.log(`Found ${cases.length} cases:`);
  cases.forEach(c => console.log(` - ${c.caseNumber} [${c.bureau}] Overlap: ${c.overlapFlag} - ${c.subject}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
