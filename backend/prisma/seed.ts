import { PrismaClient, Role, BetStatus, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

function eurosToCents(eur: number) {
  return Math.round(eur * 100);
}

async function main() {
  const users = [
    { email: 'admin@pena.local', name: 'Admin Peña', role: Role.admin },
    { email: 'persona01@pena.local', name: 'Persona 01', role: Role.user },
    { email: 'persona02@pena.local', name: 'Persona 02', role: Role.user },
    { email: 'persona03@pena.local', name: 'Persona 03', role: Role.user },
    { email: 'persona04@pena.local', name: 'Persona 04', role: Role.user },
    { email: 'persona05@pena.local', name: 'Persona 05', role: Role.user },
    { email: 'persona06@pena.local', name: 'Persona 06', role: Role.user },
    { email: 'persona07@pena.local', name: 'Persona 07', role: Role.user },
    { email: 'persona08@pena.local', name: 'Persona 08', role: Role.user },
    { email: 'persona09@pena.local', name: 'Persona 09', role: Role.user },
    { email: 'persona10@pena.local', name: 'Persona 10', role: Role.user },
    { email: 'persona11@pena.local', name: 'Persona 11', role: Role.user },
    { email: 'persona12@pena.local', name: 'Persona 12', role: Role.user },
    { email: 'persona13@pena.local', name: 'Persona 13', role: Role.user },
    { email: 'persona14@pena.local', name: 'Persona 14', role: Role.user },
    { email: 'persona15@pena.local', name: 'Persona 15', role: Role.user },
    { email: 'persona16@pena.local', name: 'Persona 16', role: Role.user },
    { email: 'persona17@pena.local', name: 'Persona 17', role: Role.user },
    { email: 'persona18@pena.local', name: 'Persona 18', role: Role.user },
  ];

  await prisma.user.createMany({ data: users, skipDuplicates: true });

  // Fondo inicial (ejemplo): 500€ depositados, 20€ apostados, 120€ premio
  await prisma.transaction.createMany({
    data: [
      {
        type: TransactionType.deposit,
        amount: eurosToCents(500),
        description: 'Fondo inicial',
      },
      {
        type: TransactionType.bet,
        amount: eurosToCents(20),
        description: 'Apuesta inicial',
      },
      {
        type: TransactionType.prize,
        amount: eurosToCents(120),
        description: 'Premio inicial',
      },
    ],
  });

  await prisma.bet.createMany({
    data: [
      {
        date: new Date(),
        amount: eurosToCents(10),
        fileUrl: null,
        betCode: 'BET-0001',
        status: BetStatus.pending,
        prizeAmount: null,
        validatedAt: null,
      },
      {
        date: new Date(),
        amount: eurosToCents(10),
        fileUrl: null,
        betCode: 'BET-0002',
        status: BetStatus.won,
        prizeAmount: eurosToCents(120),
        validatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

