import { PrismaClient, PropertyStatus, VerificationStatus, AvailabilityStatus, PropertyType, RentPeriod, Role, LandlordType } from "@prisma/client";
import { mockProperties } from "../src/lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Wipe existing data (safe — dev only)
  await prisma.contactRequest.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.propertyPhoto.deleteMany();
  await prisma.property.deleteMany();
  await prisma.landlordProfile.deleteMany();
  await prisma.user.deleteMany();
  console.log("  ✓ cleared existing rows");

  // ── Demo landlords ─────────────────────────────────────────
  const landlordA = await prisma.user.create({
    data: {
      phone: "+2348012345001",
      phoneVerified: true,
      name: "Ryan Cherney",
      email: "ryan@circleone.ng",
      role: Role.LANDLORD,
      landlordProfile: {
        create: {
          landlordType: LandlordType.AGENT,
          bio: "Circle One Realty — Akwa Ibom's trusted listing partner.",
          whatsappNumber: "+2348012345001",
          idVerified: true,
          totalProperties: 0,
          responseRate: 95,
          avgResponseTime: 30,
        },
      },
    },
  });

  const landlordB = await prisma.user.create({
    data: {
      phone: "+2348012345002",
      phoneVerified: true,
      name: "Emem Akpan",
      email: "emem@uno.ng",
      role: Role.LANDLORD,
      landlordProfile: {
        create: {
          landlordType: LandlordType.INDIVIDUAL,
          bio: "Independent landlord — Uyo properties.",
          whatsappNumber: "+2348012345002",
          idVerified: true,
          totalProperties: 0,
          responseRate: 88,
          avgResponseTime: 60,
        },
      },
    },
  });
  console.log(`  ✓ created 2 landlords`);

  // ── Demo renter ────────────────────────────────────────────
  const renter = await prisma.user.create({
    data: {
      phone: "+2348099999999",
      phoneVerified: true,
      name: "Demo Renter",
      role: Role.RENTER,
    },
  });
  console.log(`  ✓ created 1 renter`);

  // ── Properties from mock-data ──────────────────────────────
  let count = 0;
  for (const [i, mock] of mockProperties.entries()) {
    const landlordId = i % 2 === 0 ? landlordA.id : landlordB.id;

    // Map mock VerificationStatus → Prisma status fields
    const verification: VerificationStatus =
      mock.verificationStatus === "VERIFIED"
        ? VerificationStatus.VERIFIED
        : VerificationStatus.PENDING;
    const status: PropertyStatus =
      verification === VerificationStatus.VERIFIED
        ? PropertyStatus.ACTIVE
        : PropertyStatus.PENDING;

    await prisma.property.create({
      data: {
        landlordId,
        title: mock.title,
        propertyType: mock.propertyType as PropertyType,
        bedrooms: mock.bedrooms,
        bathrooms: mock.bathrooms,
        amenities: mock.amenities,
        customAmenities: [],
        city: mock.city,
        area: mock.area,
        rent: mock.rent,
        rentPeriod: mock.rentPeriod as RentPeriod,
        currency: mock.currency,
        negotiable: mock.negotiable,
        status,
        verificationStatus: verification,
        availabilityStatus: mock.availabilityStatus as AvailabilityStatus,
        verifiedAt: verification === VerificationStatus.VERIFIED ? new Date() : null,
        approvedAt: status === PropertyStatus.ACTIVE ? new Date() : null,
        goesLiveAt: status === PropertyStatus.ACTIVE ? mock.createdAt : null,
        createdAt: mock.createdAt,
        photos: {
          create: mock.photos.map((p, order) => ({
            url: p.url,
            isMain: p.isMain,
            order,
          })),
        },
      },
    });
    count++;
  }
  console.log(`  ✓ created ${count} properties with photos`);

  // Update landlord property counts
  for (const landlord of [landlordA, landlordB]) {
    const total = await prisma.property.count({ where: { landlordId: landlord.id } });
    await prisma.landlordProfile.update({
      where: { userId: landlord.id },
      data: { totalProperties: total },
    });
  }

  // ── A couple of demo favourites ────────────────────────────
  const firstTwo = await prisma.property.findMany({ take: 2, orderBy: { createdAt: "desc" } });
  for (const p of firstTwo) {
    await prisma.favourite.create({
      data: { userId: renter.id, propertyId: p.id },
    });
  }
  console.log(`  ✓ created ${firstTwo.length} demo favourites`);

  console.log("\n✅ Seed complete.\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
