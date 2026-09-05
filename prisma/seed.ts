import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Corrige acentos que o acervo de demonstracao nasceu sem.
 *
 * Categoria e autor tem o nome como chave unica, entao o upsert com o nome
 * certo criaria uma linha nova e deixaria a antiga pendurada com os vinculos.
 * Renomeando antes, o upsert seguinte encontra a linha e nao duplica nada.
 */
async function renomear() {
  const pares: [string, string][] = [
    ['Ficcao Cientifica', 'Ficção Científica'],
    ['Historia', 'História'],
  ];
  for (const [de, para] of pares) {
    const antiga = await prisma.category.findUnique({ where: { name: de } });
    const nova = await prisma.category.findUnique({ where: { name: para } });
    if (antiga && !nova) await prisma.category.update({ where: { id: antiga.id }, data: { name: para } });
  }

  const autores: [string, string][] = [['Guimaraes Rosa', 'Guimarães Rosa']];
  for (const [de, para] of autores) {
    const antigo = await prisma.author.findUnique({ where: { name: de } });
    const novo = await prisma.author.findUnique({ where: { name: para } });
    if (antigo && !novo) await prisma.author.update({ where: { id: antigo.id }, data: { name: para } });
  }

  await prisma.user.updateMany({ where: { email: 'balcao@biblioteca.dev' }, data: { name: 'Bruno Balcão' } });
}

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
        name: 'Bruno Balcão',
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

  await renomear();

  const categorias = await Promise.all(
    ['Literatura Brasileira', 'Ficção Científica', 'Tecnologia', 'História'].map((name) =>
      prisma.category.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  const autores = await Promise.all(
    [
      { name: 'Guimarães Rosa', bio: 'Autor mineiro, mestre da linguagem inventada.' },
      { name: 'Machado de Assis', bio: 'Fundador da Academia Brasileira de Letras.' },
      { name: 'Ursula K. Le Guin', bio: 'Escritora norte-americana de ficção científica.' },
      { name: 'Robert C. Martin', bio: 'Engenheiro de software, autor de Clean Code.' },
    ].map((data) => prisma.author.upsert({ where: { name: data.name }, update: {}, create: data })),
  );

  const acervo = [
    {
      isbn: '9788535902778',
      title: 'Grande Sertão: Veredas',
      publisher: 'Companhia das Letras',
      publishedYear: 1956,
      categoryIdx: 0,
      autorIdx: 0,
      exemplares: 3,
    },
    {
      isbn: '9788572322836',
      title: 'Memórias Póstumas de Brás Cubas',
      publisher: 'Nova Aguilar',
      publishedYear: 1881,
      categoryIdx: 0,
      autorIdx: 1,
      exemplares: 2,
    },
    {
      isbn: '9780441478125',
      title: 'A Mão Esquerda da Escuridão',
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
      update: { title: item.title, publisher: item.publisher, publishedYear: item.publishedYear },
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
