import { PrismaClient, PropertyStatus, VerificationStatus, AvailabilityStatus, PropertyType, RentPeriod, ListingType, Role, LandlordType } from "@prisma/client";
import { mockProperties } from "../src/lib/mock-data";

const prisma = new PrismaClient();

// Stock interior shots used to pad every listing to ≥ 6 photos
const STOCK_PHOTOS = [
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
  "https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80",
  "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&q=80",
  "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80",
  "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&q=80",
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
];

const MIN_PHOTOS = 6;

// Additional properties seeded directly here (not through mock-data.ts).
// Covers all PropertyTypes, multiple cities, and a mix of verified/pending.
type SeedProp = {
  title: string;
  propertyType: PropertyType;
  listingType: ListingType;
  bedrooms: number;
  bathrooms: number;
  area: string;
  city: string;
  rent: number;
  rentPeriod: RentPeriod;
  amenities: string[];
  verified: boolean;
  availableNow?: boolean;
  daysAgo?: number;
  description?: string;
};

const EXTRA_PROPERTIES: SeedProp[] = [
  // ─────────────────────────────────────────────────────────────────
  // FOR RENT (residential, periodic)
  // ─────────────────────────────────────────────────────────────────

  // SELF_CONTAIN (the gap — currently 0 active)
  { title: "Modern Self Contain at Aka Etinan Road", propertyType: PropertyType.SELF_CONTAIN, listingType: ListingType.RENT, bedrooms: 1, bathrooms: 1, area: "Aka Etinan Road", city: "Uyo", rent: 180000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Prepaid Meter", "Tiled Floor", "Security/Gate"], verified: true, daysAgo: 4 },
  { title: "Cozy Self Con near University of Uyo", propertyType: PropertyType.SELF_CONTAIN, listingType: ListingType.RENT, bedrooms: 1, bathrooms: 1, area: "Ikpa Road", city: "Uyo", rent: 220000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Tiled Floor", "Wardrobe"], verified: true, daysAgo: 6 },
  { title: "Spacious Self Contain at Itam", propertyType: PropertyType.SELF_CONTAIN, listingType: ListingType.RENT, bedrooms: 1, bathrooms: 1, area: "Itam", city: "Uyo", rent: 150000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Prepaid Meter", "Fence/Wall"], verified: true, daysAgo: 2 },
  { title: "Furnished Self Contain at Eket Marina", propertyType: PropertyType.SELF_CONTAIN, listingType: ListingType.RENT, bedrooms: 1, bathrooms: 1, area: "Marina", city: "Eket", rent: 250000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Air Conditioning", "Wardrobe", "Tiled Floor"], verified: true, daysAgo: 8 },

  // FLATs (rent) — multi-city
  { title: "Luxury 3BR Flat in Lekki Phase 1", propertyType: PropertyType.FLAT, listingType: ListingType.RENT, bedrooms: 3, bathrooms: 3, area: "Lekki Phase 1", city: "Lagos", rent: 4500000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Air Conditioning", "Swimming Pool", "Gym", "Security/Gate", "CCTV"], verified: true, daysAgo: 3 },
  { title: "2 Bedroom Flat at Ikoyi", propertyType: PropertyType.FLAT, listingType: ListingType.RENT, bedrooms: 2, bathrooms: 2, area: "Ikoyi", city: "Lagos", rent: 3200000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Parking Space", "Security/Gate"], verified: true, daysAgo: 5 },
  { title: "Serviced 2BR Flat at Wuse 2", propertyType: PropertyType.FLAT, listingType: ListingType.RENT, bedrooms: 2, bathrooms: 2, area: "Wuse 2", city: "Abuja", rent: 2800000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Air Conditioning", "Parking Space", "Security/Gate"], verified: true, daysAgo: 7 },
  { title: "3 Bedroom Apartment at Maitama", propertyType: PropertyType.FLAT, listingType: ListingType.RENT, bedrooms: 3, bathrooms: 3, area: "Maitama", city: "Abuja", rent: 5500000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Swimming Pool", "Gym", "CCTV", "Security/Gate"], verified: true, daysAgo: 1 },
  { title: "3BR Flat at GRA Phase 2 Port Harcourt", propertyType: PropertyType.FLAT, listingType: ListingType.RENT, bedrooms: 3, bathrooms: 2, area: "GRA Phase 2", city: "Port Harcourt", rent: 2200000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Borehole", "Security/Gate"], verified: true, daysAgo: 11 },

  // HOUSE & DUPLEX & BUNGALOW (rent)
  { title: "4 Bedroom Terraced House at Asokoro", propertyType: PropertyType.HOUSE, listingType: ListingType.RENT, bedrooms: 4, bathrooms: 4, area: "Asokoro", city: "Abuja", rent: 8500000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Swimming Pool", "Security/Gate", "CCTV"], verified: true, daysAgo: 6 },
  { title: "Family House with BQ at Calabar", propertyType: PropertyType.HOUSE, listingType: ListingType.RENT, bedrooms: 4, bathrooms: 3, area: "State Housing Estate", city: "Calabar", rent: 1500000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Borehole", "Fence/Wall", "Security/Gate", "Parking Space"], verified: true, daysAgo: 15 },
  { title: "4BR Semi-Detached Duplex at Lekki", propertyType: PropertyType.DUPLEX, listingType: ListingType.RENT, bedrooms: 4, bathrooms: 4, area: "Chevron Drive", city: "Lagos", rent: 7000000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Swimming Pool", "Security/Gate", "CCTV"], verified: true, daysAgo: 4 },
  { title: "3BR Bungalow at Kado Estate", propertyType: PropertyType.BUNGALOW, listingType: ListingType.RENT, bedrooms: 3, bathrooms: 2, area: "Kado", city: "Abuja", rent: 1900000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Borehole", "Fence/Wall", "Parking Space"], verified: true, daysAgo: 5 },
  { title: "2 Bedroom Bungalow at Akwa Ibom", propertyType: PropertyType.BUNGALOW, listingType: ListingType.RENT, bedrooms: 2, bathrooms: 2, area: "Ediene Abak Road", city: "Uyo", rent: 380000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Tiled Floor", "Fence/Wall"], verified: true, daysAgo: 13 },

  // ─────────────────────────────────────────────────────────────────
  // FOR SALE (one-time purchase)
  // ─────────────────────────────────────────────────────────────────
  { title: "5 Bedroom Detached House for Sale at Lekki County", propertyType: PropertyType.HOUSE, listingType: ListingType.SALE, bedrooms: 5, bathrooms: 5, area: "Lekki County", city: "Lagos", rent: 280000000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Swimming Pool", "Gym", "CCTV", "Security/Gate", "Parking Space"], verified: true, daysAgo: 2 },
  { title: "4BR Detached Duplex for Sale at Asokoro", propertyType: PropertyType.DUPLEX, listingType: ListingType.SALE, bedrooms: 4, bathrooms: 4, area: "Asokoro", city: "Abuja", rent: 220000000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Borehole", "CCTV", "Security/Gate"], verified: true, daysAgo: 5 },
  { title: "3BR Bungalow for Sale at Shelter Afrique", propertyType: PropertyType.BUNGALOW, listingType: ListingType.SALE, bedrooms: 3, bathrooms: 3, area: "Shelter Afrique", city: "Uyo", rent: 35000000, rentPeriod: RentPeriod.YEAR, amenities: ["Borehole", "Generator", "Security/Gate", "Parking Space", "Fence/Wall"], verified: true, daysAgo: 9 },
  { title: "5BR Fully Detached Duplex for Sale Gwarinpa", propertyType: PropertyType.DUPLEX, listingType: ListingType.SALE, bedrooms: 5, bathrooms: 5, area: "Gwarinpa", city: "Abuja", rent: 180000000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Borehole", "Generator", "CCTV", "Security/Gate", "Parking Space"], verified: true, daysAgo: 8 },
  { title: "Half Plot of Land for Sale at Sangotedo", propertyType: PropertyType.LAND, listingType: ListingType.SALE, bedrooms: 0, bathrooms: 0, area: "Sangotedo", city: "Lagos", rent: 25000000, rentPeriod: RentPeriod.YEAR, amenities: ["Road Network", "Fence/Wall"], verified: true, daysAgo: 20 },
  { title: "Full Plot for Sale at Lugbe", propertyType: PropertyType.LAND, listingType: ListingType.SALE, bedrooms: 0, bathrooms: 0, area: "Lugbe", city: "Abuja", rent: 18000000, rentPeriod: RentPeriod.YEAR, amenities: ["Road Network"], verified: true, daysAgo: 22 },
  { title: "Mini Flat for Sale at Lekki Phase 2", propertyType: PropertyType.FLAT, listingType: ListingType.SALE, bedrooms: 1, bathrooms: 1, area: "Lekki Phase 2", city: "Lagos", rent: 45000000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Tiled Floor", "Wardrobe"], verified: true, daysAgo: 9 },

  // ─────────────────────────────────────────────────────────────────
  // FOR LEASE (typically commercial / long-term)
  // ─────────────────────────────────────────────────────────────────
  { title: "Retail Shop for Lease at Wuse Market", propertyType: PropertyType.COMMERCIAL, listingType: ListingType.LEASE, bedrooms: 0, bathrooms: 1, area: "Wuse Market", city: "Abuja", rent: 850000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Security/Gate"], verified: true, daysAgo: 6 },
  { title: "Office Space for Lease at Victoria Island", propertyType: PropertyType.COMMERCIAL, listingType: ListingType.LEASE, bedrooms: 0, bathrooms: 2, area: "Victoria Island", city: "Lagos", rent: 6500000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Air Conditioning", "Parking Space", "CCTV", "Security/Gate"], verified: true, daysAgo: 9 },
  { title: "Warehouse for Lease at Trans Amadi", propertyType: PropertyType.COMMERCIAL, listingType: ListingType.LEASE, bedrooms: 0, bathrooms: 1, area: "Trans Amadi Industrial Layout", city: "Port Harcourt", rent: 4500000, rentPeriod: RentPeriod.YEAR, amenities: ["Generator", "Fence/Wall", "Security/Gate", "Parking Space"], verified: true, daysAgo: 17 },
  { title: "Shop Space for Lease at Watt Market", propertyType: PropertyType.COMMERCIAL, listingType: ListingType.LEASE, bedrooms: 0, bathrooms: 1, area: "Watt Market", city: "Calabar", rent: 600000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Security/Gate"], verified: true, daysAgo: 11 },
  { title: "5-Year Lease: Mall Anchor Space at Ikeja", propertyType: PropertyType.COMMERCIAL, listingType: ListingType.LEASE, bedrooms: 0, bathrooms: 4, area: "Ikeja GRA", city: "Lagos", rent: 12000000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Air Conditioning", "Parking Space", "CCTV", "Security/Gate"], verified: true, daysAgo: 14 },
  { title: "Long-Lease 4BR House at Maitama", propertyType: PropertyType.HOUSE, listingType: ListingType.LEASE, bedrooms: 4, bathrooms: 4, area: "Maitama", city: "Abuja", rent: 9000000, rentPeriod: RentPeriod.YEAR, amenities: ["Water Supply", "Generator", "Swimming Pool", "Gym", "CCTV", "Security/Gate"], verified: true, daysAgo: 12 },
];

/** Returns at least MIN_PHOTOS photos, padding from STOCK_PHOTOS if needed. */
function padPhotos(input: { url: string; isMain: boolean }[], propertyIndex: number) {
  const seen = new Set(input.map((p) => p.url));
  const padded = [...input];
  let i = propertyIndex; // rotate stock starting point so listings differ visually
  while (padded.length < MIN_PHOTOS) {
    const url = STOCK_PHOTOS[i % STOCK_PHOTOS.length];
    i++;
    if (seen.has(url)) continue;
    seen.add(url);
    padded.push({ url, isMain: false });
  }
  return padded;
}

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
      email: "renter@demo.uno",
      emailVerified: true,
      phone: "+2348099999999",
      phoneVerified: false,
      name: "Demo Renter",
      role: Role.RENTER,
    },
  });
  console.log(`  ✓ created 1 renter`);

  // ── Properties from mock-data ──────────────────────────────
  let count = 0;
  for (let i = 0; i < mockProperties.length; i++) {
    const mock = mockProperties[i];
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

    // Mock data has no listingType; LAND defaults to SALE, everything else to RENT
    const listingType: ListingType =
      mock.propertyType === "LAND" ? ListingType.SALE : ListingType.RENT;

    await prisma.property.create({
      data: {
        landlordId,
        title: mock.title,
        propertyType: mock.propertyType as PropertyType,
        listingType,
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
          create: padPhotos(mock.photos, i).map(
            (p: { url: string; isMain: boolean }, order: number) => ({
              url: p.url,
              isMain: p.isMain,
              order,
            })
          ),
        },
      },
    });
    count++;
  }
  console.log(`  ✓ created ${count} properties from mock-data`);

  // ── Extras ──────────────────────────────────────────────────
  let extraCount = 0;
  for (let i = 0; i < EXTRA_PROPERTIES.length; i++) {
    const e = EXTRA_PROPERTIES[i];
    const landlordId = i % 2 === 0 ? landlordA.id : landlordB.id;
    const verification = e.verified ? VerificationStatus.VERIFIED : VerificationStatus.PENDING;
    const status = e.verified ? PropertyStatus.ACTIVE : PropertyStatus.PENDING;
    const createdAt = new Date(Date.now() - (e.daysAgo ?? 7) * 24 * 60 * 60 * 1000);

    await prisma.property.create({
      data: {
        landlordId,
        title: e.title,
        propertyType: e.propertyType,
        listingType: e.listingType,
        bedrooms: e.bedrooms,
        bathrooms: e.bathrooms,
        amenities: e.amenities,
        customAmenities: [],
        city: e.city,
        area: e.area,
        rent: e.rent,
        rentPeriod: e.rentPeriod,
        currency: "NGN",
        negotiable: false,
        description: e.description,
        status,
        verificationStatus: verification,
        availabilityStatus: e.availableNow !== false ? AvailabilityStatus.AVAILABLE_NOW : AvailabilityStatus.AVAILABLE_FROM,
        verifiedAt: e.verified ? createdAt : null,
        approvedAt: e.verified ? createdAt : null,
        goesLiveAt: e.verified ? createdAt : null,
        createdAt,
        photos: {
          create: padPhotos([], mockProperties.length + i).map((p, order) => ({
            url: p.url,
            isMain: order === 0,
            order,
          })),
        },
      },
    });
    extraCount++;
  }
  console.log(`  ✓ created ${extraCount} extras (rent, sale, lease)`);
  console.log(`  Total properties: ${count + extraCount}`);

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
