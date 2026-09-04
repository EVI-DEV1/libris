import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash('admin12345', 10);

  const [admin, bibliotecario, leitor] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@biblioteca.dev' },
      update: {},
      create: { name: 'Ana Diretora', email: 'admin@biblioteca.dev', passwordHash: senha, role: 'ADMIN' },
    }),
    prisma.user.upsert({
      where: { email: 'balcao@biblioteca.dev' },
      update: {},
      create: {
        name: 'Bruno Balcao',
        email: 'balcao@biblioteca.dev',
        passwordHash: senha,
        role: 'LIBRARIAN',
      },
    }),
    prisma.user.upsert({
      where: { email: 'leitor@biblioteca.dev' },
      update: {},
      create: { name: 'Carla Leitora', email: 'leitor@biblioteca.dev', passwordHash: senha },
    }),
  ]);

  const categorias = await Promise.all(
    ['Literatura Brasileira', 'Ficcao Cientifica', 'Tecnologia', 'Historia'].map((name) =>
      prisma.category.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  const autores = await Promise.all(
    [
      { name: 'Guimaraes Rosa', bio: 'Autor mineiro, mestre da linguagem inventada.' },
      { name: 'Machado de Assis', bio: 'Fundador da Academia Brasileira de Letras.' },
      { name: 'Ursula K. Le Guin', bio: 'Escritora norte-americana de ficcao cientifica.' },
      { name: 'Robert C. Martin', bio: 'Engenheiro de software, autor de Clean Code.' },
    ].map((data) => prisma.author.upsert({ where: { name: data.name }, update: {}, create: data })),
  );

  const acervo = [
    {
      isbn: '9788535902778',
      title: 'Grande Sertao: Veredas',
      publisher: 'Companhia das Letras',
      publishedYear: 1956,
      categoryIdx: 0,
      autorIdx: 0,
      exemplares: 3,
    },
    {
      isbn: '9788572322836',
      title: 'Memorias Postumas de Bras Cubas',
      publisher: 'Nova Aguilar',
      publishedYear: 1881,
      categoryIdx: 0,
      autorIdx: 1,
      exemplares: 2,
    },
    {
      isbn: '9780441478125',
      title: 'A Mao Esquerda da Escuridao',
      publisher: 'Aleph',
      publishedYear: 1969,
      categoryIdx: 1,
      autorIdx: 2,
      exemplares: 1,
    },
    {
      isbn: '9780132350884',
      title: 'Clean Code',
      publisher: 'Prentice Hall',
      publishedYear: 2008,
      categoryIdx: 2,
      autorIdx: 3,
      exemplares: 4,
    },
  ];

  for (const item of acervo) {
    const book = await prisma.book.upsert({
      where: { isbn: item.isbn },
      update: {},
      create: {
        isbn: item.isbn,
        title: item.title,
        publisher: item.publisher,
        publishedYear: item.publishedYear,
        categoryId: categorias[item.categoryIdx]!.id,
        authors: { create: [{ authorId: autores[item.autorIdx]!.id }] },
      },
    });

    for (let i = 1; i <= item.exemplares; i++) {
      const code = `${item.isbn.slice(-4)}-${String(i).padStart(3, '0')}`;
      await prisma.copy.upsert({
        where: { code },
        update: {},
        create: { code, bookId: book.id, shelf: `E-${item.categoryIdx + 1}` },
      });
    }
  }

  console.log('Seed concluido.');
  console.log(`  ADMIN      ${admin.email} / admin12345`);
  console.log(`  LIBRARIAN  ${bibliotecario.email} / admin12345`);
  console.log(`  MEMBER     ${leitor.email} / admin12345`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
