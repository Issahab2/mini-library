import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data (optional - comment out if you want to keep existing data)
  await prisma.checkout.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.book.deleteMany();
  await prisma.permissionsOnRoles.deleteMany();
  await prisma.rolesOnUsers.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Permissions
  console.log("📝 Creating permissions...");
  const permissions = await Promise.all([
    prisma.permission.create({ data: { action: "book:read", description: "Read books" } }),
    prisma.permission.create({ data: { action: "book:create", description: "Create books" } }),
    prisma.permission.create({ data: { action: "book:update", description: "Update books" } }),
    prisma.permission.create({ data: { action: "book:delete", description: "Delete books" } }),
    prisma.permission.create({ data: { action: "checkout:create", description: "Create checkouts" } }),
    prisma.permission.create({ data: { action: "checkout:return", description: "Return checkouts" } }),
    prisma.permission.create({ data: { action: "checkout:manage", description: "Manage all checkouts" } }),
    prisma.permission.create({ data: { action: "user:manage", description: "Manage users" } }),
    prisma.permission.create({ data: { action: "finance:manage", description: "Manage finances" } }),
  ]);

  const [
    bookRead,
    bookCreate,
    bookUpdate,
    bookDelete,
    checkoutCreate,
    checkoutReturn,
    checkoutManage,
    userManage,
    financeManage,
  ] = permissions;

  console.log(bookDelete, userManage);

  // 2. Create Roles
  console.log("👥 Creating roles...");
  const adminRole = await prisma.role.create({
    data: {
      name: "Admin",
      description: "Full system access",
    },
  });

  const financeManagerRole = await prisma.role.create({
    data: {
      name: "Finance Manager",
      description: "Manages finances and checkouts",
    },
  });

  const editorRole = await prisma.role.create({
    data: {
      name: "Editor",
      description: "Manages book content",
    },
  });

  const customerRole = await prisma.role.create({
    data: {
      name: "Customer",
      description: "Standard library user",
    },
  });

  // 3. Assign Permissions to Roles
  console.log("🔗 Assigning permissions to roles...");

  // Admin: All permissions
  await Promise.all(
    permissions.map((permission) =>
      prisma.permissionsOnRoles.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  // Finance Manager: book:read, checkout:manage, finance:manage
  await Promise.all([
    prisma.permissionsOnRoles.create({
      data: { roleId: financeManagerRole.id, permissionId: bookRead.id },
    }),
    prisma.permissionsOnRoles.create({
      data: { roleId: financeManagerRole.id, permissionId: checkoutManage.id },
    }),
    prisma.permissionsOnRoles.create({
      data: { roleId: financeManagerRole.id, permissionId: financeManage.id },
    }),
  ]);

  // Editor: book:read, book:create, book:update
  await Promise.all([
    prisma.permissionsOnRoles.create({
      data: { roleId: editorRole.id, permissionId: bookRead.id },
    }),
    prisma.permissionsOnRoles.create({
      data: { roleId: editorRole.id, permissionId: bookCreate.id },
    }),
    prisma.permissionsOnRoles.create({
      data: { roleId: editorRole.id, permissionId: bookUpdate.id },
    }),
  ]);

  // Customer: book:read, checkout:create, checkout:return
  await Promise.all([
    prisma.permissionsOnRoles.create({
      data: { roleId: customerRole.id, permissionId: bookRead.id },
    }),
    prisma.permissionsOnRoles.create({
      data: { roleId: customerRole.id, permissionId: checkoutCreate.id },
    }),
    prisma.permissionsOnRoles.create({
      data: { roleId: customerRole.id, permissionId: checkoutReturn.id },
    }),
  ]);

  // 4. Create Sample Books with Chapters
  console.log("📚 Creating books...");

  const books = [
    {
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      isbn: "978-0-7432-7356-5",
      description: "A classic American novel about the Jazz Age",
      summary:
        "Set in the summer of 1922, the novel follows Nick Carraway's observations of his mysterious neighbor Jay Gatsby and Gatsby's obsession with reuniting with his former lover, Daisy Buchanan.",
      publisher: "Scribner",
      publicationYear: 1925,
      genre: "Fiction",
      pageCount: 180,
      language: "English",
      coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
      chapters: [
        { title: "Chapter 1: The Valley of Ashes", content: "In my younger and more vulnerable years...", order: 1 },
        { title: "Chapter 2: The Party", content: "There was music from my neighbor's house...", order: 2 },
        { title: "Chapter 3: The Reunion", content: "There must have been moments...", order: 3 },
      ],
    },
    {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      isbn: "978-0-06-112008-4",
      description: "A gripping tale of racial injustice and childhood innocence",
      summary:
        "Set in the American South during the 1930s, the novel follows Scout Finch and her brother Jem as their father, Atticus, defends a Black man falsely accused of rape.",
      publisher: "J.B. Lippincott & Co.",
      publicationYear: 1960,
      genre: "Fiction",
      pageCount: 376,
      language: "English",
      coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg",
      chapters: [
        { title: "Part One: Chapter 1", content: "When he was nearly thirteen...", order: 1 },
        { title: "Part One: Chapter 2", content: "Dill left us early in September...", order: 2 },
        { title: "Part Two: Chapter 10", content: "Atticus was feeble...", order: 3 },
      ],
    },
    {
      title: "1984",
      author: "George Orwell",
      isbn: "978-0-452-28423-4",
      description: "A dystopian social science fiction novel",
      summary:
        "In a totalitarian society where Big Brother is always watching, Winston Smith rebels against the Party by falling in love and questioning the system.",
      publisher: "Secker & Warburg",
      publicationYear: 1949,
      genre: "Science Fiction",
      pageCount: 328,
      language: "English",
      coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780452284234-L.jpg",
      chapters: [
        { title: "Part 1: Chapter 1", content: "It was a bright cold day in April...", order: 1 },
        { title: "Part 1: Chapter 2", content: "Winston kept his back turned...", order: 2 },
        { title: "Part 2: Chapter 1", content: "It was the middle of the morning...", order: 3 },
      ],
    },
    {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      isbn: "978-0-14-143951-8",
      description: "A romantic novel of manners",
      summary:
        "The story follows Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage in the society of the landed gentry of early 19th-century England.",
      publisher: "T. Egerton",
      publicationYear: 1813,
      genre: "Romance",
      pageCount: 432,
      language: "English",
      coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
      chapters: [
        { title: "Chapter 1", content: "It is a truth universally acknowledged...", order: 1 },
        { title: "Chapter 2", content: "Mr. Bennet was among the earliest...", order: 2 },
        { title: "Chapter 3", content: "Not all that Mrs. Bennet...", order: 3 },
      ],
    },
    {
      title: "The Catcher in the Rye",
      author: "J.D. Salinger",
      isbn: "978-0-316-76948-0",
      description: "A controversial coming-of-age novel",
      summary:
        "The story is told by Holden Caulfield, a troubled teenager who has been expelled from prep school, as he wanders around New York City.",
      publisher: "Little, Brown and Company",
      publicationYear: 1951,
      genre: "Fiction",
      pageCount: 234,
      language: "English",
      coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780316769480-L.jpg",
      chapters: [
        { title: "Chapter 1", content: "If you really want to hear about it...", order: 1 },
        { title: "Chapter 2", content: "I'm not going to tell you my whole goddam autobiography...", order: 2 },
        { title: "Chapter 3", content: "I'm the most terrific liar you ever saw...", order: 3 },
      ],
    },
    {
      title: "The Lord of the Rings",
      author: "J.R.R. Tolkien",
      isbn: "978-0-544-00027-0",
      description: "An epic high fantasy novel",
      summary:
        "The story follows Frodo Baggins and the Fellowship of the Ring as they attempt to destroy the One Ring and defeat the Dark Lord Sauron.",
      publisher: "Allen & Unwin",
      publicationYear: 1954,
      genre: "Fantasy",
      pageCount: 1178,
      language: "English",
      coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780544000270-L.jpg",
      chapters: [
        { title: "Book 1: Chapter 1", content: "When Mr. Bilbo Baggins of Bag End...", order: 1 },
        { title: "Book 1: Chapter 2", content: "The next day Frodo woke early...", order: 2 },
        { title: "Book 1: Chapter 3", content: "Three is Company...", order: 3 },
      ],
    },
    {
      title: "Harry Potter and the Philosopher's Stone",
      author: "J.K. Rowling",
      isbn: "978-0-7475-3269-6",
      description: "The first book in the Harry Potter series",
      summary:
        "An orphaned boy discovers he is a wizard and begins his education at Hogwarts School of Witchcraft and Wizardry.",
      publisher: "Bloomsbury",
      publicationYear: 1997,
      genre: "Fantasy",
      pageCount: 223,
      language: "English",
      coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780747532696-L.jpg",
      chapters: [
        { title: "Chapter 1: The Boy Who Lived", content: "Mr. and Mrs. Dursley...", order: 1 },
        { title: "Chapter 2: The Vanishing Glass", content: "Nearly ten years had passed...", order: 2 },
        {
          title: "Chapter 3: The Letters from No One",
          content: "The escape of the Brazilian boa constrictor...",
          order: 3,
        },
      ],
    },
    {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      isbn: "978-0-544-00027-1",
      description: "A fantasy novel and prequel to The Lord of the Rings",
      summary:
        "Bilbo Baggins, a hobbit, is recruited by the wizard Gandalf to help a group of dwarves reclaim their homeland from the dragon Smaug.",
      publisher: "Allen & Unwin",
      publicationYear: 1937,
      genre: "Fantasy",
      pageCount: 310,
      language: "English",
      coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780544000271-L.jpg",
      chapters: [
        {
          title: "Chapter 1: An Unexpected Party",
          content: "In a hole in the ground there lived a hobbit...",
          order: 1,
        },
        { title: "Chapter 2: Roast Mutton", content: "Up jumped Bilbo...", order: 2 },
        { title: "Chapter 3: A Short Rest", content: "They did not sing or tell stories...", order: 3 },
      ],
    },
  ];

  for (const bookData of books) {
    const { chapters, ...bookFields } = bookData;
    const book = await prisma.book.create({
      data: bookFields,
    });

    if (chapters && chapters.length > 0) {
      await Promise.all(
        chapters.map((chapter) =>
          prisma.chapter.create({
            data: {
              ...chapter,
              bookId: book.id,
            },
          })
        )
      );
    }
  }

  // 5. Create Sample Users
  console.log("👤 Creating users...");

  // Create admin user from environment variables
  const adminEmail = process.env.ADMIN_EMAIL || "admin@library.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Admin User";

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedAdminPassword,
      maxCheckoutLimit: 10,
      isStaff: true, // Admin is staff
      roles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  console.log(`   ✓ Created admin user: ${adminEmail}`);

  console.log("✅ Seed completed successfully!");
  console.log(`   - Created ${permissions.length} permissions`);
  console.log(`   - Created 4 roles`);
  console.log(`   - Created ${books.length} books with chapters`);
  console.log(`   - Created 5 sample users`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
