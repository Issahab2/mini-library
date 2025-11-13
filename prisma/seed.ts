import { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } from "../src/lib/server/constants/env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Upsert Permissions
  console.log("📝 Upserting permissions...");
  const permissionData = [
    { action: "book:read", description: "Read books" },
    { action: "book:create", description: "Create books" },
    { action: "book:update", description: "Update books" },
    { action: "book:delete", description: "Delete books" },
    { action: "checkout:create", description: "Create checkouts" },
    { action: "checkout:return", description: "Return checkouts" },
    { action: "checkout:manage", description: "Manage all checkouts" },
    { action: "user:manage", description: "Manage users" },
    { action: "role:manage", description: "Manage roles" },
    { action: "permission:manage", description: "Manage permissions" },
    { action: "finance:manage", description: "Manage finances" },
  ];

  const permissions = await Promise.all(
    permissionData.map((data) =>
      prisma.permission.upsert({
        where: { action: data.action },
        update: { description: data.description },
        create: data,
      })
    )
  );

  const [bookRead, bookCreate, bookUpdate, checkoutCreate, checkoutReturn, checkoutManage, financeManage] = permissions;

  // 2. Upsert Roles
  console.log("👥 Upserting roles...");
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: { description: "Full system access" },
    create: {
      name: "Admin",
      description: "Full system access",
    },
  });

  const financeManagerRole = await prisma.role.upsert({
    where: { name: "Finance Manager" },
    update: { description: "Manages finances and checkouts" },
    create: {
      name: "Finance Manager",
      description: "Manages finances and checkouts",
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: "Editor" },
    update: { description: "Manages book content" },
    create: {
      name: "Editor",
      description: "Manages book content",
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: "Customer" },
    update: { description: "Standard library user" },
    create: {
      name: "Customer",
      description: "Standard library user",
    },
  });

  // 3. Upsert Role-Permission Relationships
  console.log("🔗 Upserting role-permission relationships...");

  // Admin: All permissions
  await prisma.permissionsOnRoles.createMany({
    data: permissions.map((permission) => ({
      roleId: adminRole.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  // Finance Manager: book:read, checkout:manage, finance:manage
  await prisma.permissionsOnRoles.createMany({
    data: [
      { roleId: financeManagerRole.id, permissionId: bookRead.id },
      { roleId: financeManagerRole.id, permissionId: checkoutManage.id },
      { roleId: financeManagerRole.id, permissionId: financeManage.id },
    ],
    skipDuplicates: true,
  });

  // Editor: book:read, book:create, book:update
  await prisma.permissionsOnRoles.createMany({
    data: [
      { roleId: editorRole.id, permissionId: bookRead.id },
      { roleId: editorRole.id, permissionId: bookCreate.id },
      { roleId: editorRole.id, permissionId: bookUpdate.id },
    ],
    skipDuplicates: true,
  });

  // Customer: book:read, checkout:create, checkout:return
  await prisma.permissionsOnRoles.createMany({
    data: [
      { roleId: customerRole.id, permissionId: bookRead.id },
      { roleId: customerRole.id, permissionId: checkoutCreate.id },
      { roleId: customerRole.id, permissionId: checkoutReturn.id },
    ],
    skipDuplicates: true,
  });

  // 4. Upsert Sample Books with Chapters
  console.log("📚 Upserting books...");

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

    // Upsert book by ISBN
    const book = await prisma.book.upsert({
      where: { isbn: bookFields.isbn! },
      update: {
        title: bookFields.title,
        author: bookFields.author,
        description: bookFields.description,
        summary: bookFields.summary,
        publisher: bookFields.publisher,
        publicationYear: bookFields.publicationYear,
        genre: bookFields.genre,
        pageCount: bookFields.pageCount,
        language: bookFields.language,
        coverImageUrl: bookFields.coverImageUrl,
      },
      create: bookFields,
    });

    // Upsert chapters for this book
    if (chapters && chapters.length > 0) {
      // Delete existing chapters for this book to avoid duplicates
      // Then recreate them (this ensures chapters stay in sync with seed data)
      await prisma.chapter.deleteMany({
        where: { bookId: book.id },
      });

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

  // 5. Upsert Admin User
  console.log("👤 Upserting admin user...");

  const adminEmail = ADMIN_EMAIL;
  const adminPassword = ADMIN_PASSWORD;
  const adminName = ADMIN_NAME;

  // Check if admin user exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { roles: true },
  });

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  if (existingAdmin) {
    // Update existing admin user
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        name: adminName,
        password: hashedAdminPassword,
        maxCheckoutLimit: 10,
        isStaff: true,
      },
    });

    // Ensure admin role is assigned
    const hasAdminRole = existingAdmin.roles.some((r) => r.roleId === adminRole.id);
    if (!hasAdminRole) {
      await prisma.rolesOnUsers.create({
        data: {
          userId: existingAdmin.id,
          roleId: adminRole.id,
        },
      });
    }

    console.log(`   ✓ Updated admin user: ${adminEmail}`);
  } else {
    // Create new admin user
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedAdminPassword,
        maxCheckoutLimit: 10,
        isStaff: true,
        roles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
    });

    console.log(`   ✓ Created admin user: ${adminEmail}`);
  }

  console.log("✅ Seed completed successfully!");
  console.log(`   - Upserted ${permissions.length} permissions`);
  console.log(`   - Upserted 4 roles`);
  console.log(`   - Upserted ${books.length} books with chapters`);
  console.log(`   - Upserted admin user`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
