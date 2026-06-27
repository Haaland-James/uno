"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, Bath, Home, ArrowLeft, ChevronDown } from "lucide-react";
import { useListPropertyStore, type ListPropertyData } from "@/stores/listPropertyStore";
import { useUserStore } from "@/stores/userStore";
import { getInitials } from "@/lib/utils";
import { listingsClient } from "@/lib/clients/listings";
import { toast } from "@/stores/toastStore";
import { getSteps, type StepDef, type WizardKind } from "@/components/listing/list-property/steps";
import { LocationStep } from "@/components/listing/list-property/steps/LocationStep";
import { PropertyInfoStep } from "@/components/listing/list-property/steps/PropertyInfoStep";
import { DescriptionStep } from "@/components/listing/list-property/steps/DescriptionStep";
import { AmenitiesStep } from "@/components/listing/list-property/steps/AmenitiesStep";
import { PhotosStep } from "@/components/listing/list-property/steps/PhotosStep";
import { PricingStep } from "@/components/listing/list-property/steps/PricingStep";
import { LeaseTermsStep } from "@/components/listing/list-property/steps/LeaseTermsStep";
import { ContactStep } from "@/components/listing/list-property/steps/ContactStep";
import { LandDetailsStep } from "@/components/listing/list-property/steps/LandDetailsStep";
import { AMENITIES_BY_KIND, type PropertyKind } from "@/../config/constants";

// Review is summary-only — no inputs, nothing to edit. Overview (objective) and
// Property Kind are shown in the sidebar to mirror the add-property flow but are
// disabled here because they branch the step tree (changing them would orphan
// kind-specific data already entered).
const SKIP_KEYS = new Set(["review"]);
const DISABLED_KEYS = new Set(["overview", "kind"]);

function getEditSteps(data: ListPropertyData): StepDef[] {
	const wizardKind = (data.propertyKind || "") as WizardKind;
	return getSteps(data.objective, wizardKind).filter((s) => !SKIP_KEYS.has(s.key));
}

function renderStepComponent(key: string) {
	switch (key) {
		case "location": return <LocationStep />;
		case "property-info": return <PropertyInfoStep />;
		case "description": return <DescriptionStep />;
		case "amenities": return <AmenitiesStep />;
		case "land-details": return <LandDetailsStep />;
		case "photos": return <PhotosStep />;
		case "pricing": return <PricingStep />;
		case "lease-terms": return <LeaseTermsStep />;
		case "contact": return <ContactStep />;
		default: return null;
	}
}

/* ------------------------------------------------------------------ */

interface RawProperty {
	id: string; title: string; description: string | null;
	propertyType: string; propertyKind: string;
	bedrooms: number; bathrooms: number; size: number | null; yearBuilt: number | null;
	furnishing: string | null; condition: string | null; floorNumber: string | null;
	city: string; area: string; lga: string | null;
	streetAddress: string | null; fullAddressVisible: boolean;
	latitude: number | null; longitude: number | null; geocodeAccuracy: string | null;
	amenities: string[]; customAmenities: string[];
	parkingSpaces: number | null; powerBackup: string | null; waterSource: string | null; internetReady: boolean | null;
	rent: number; rentPeriod: string;
	agencyFee: number | null; agencyFeeMode: string | null;
	legalFee: number | null; legalFeeMode: string | null;
	cautionDeposit: number | null; serviceCharge: number | null;
	negotiable: boolean; availabilityStatus: string; availableFrom: string | null; minimumLease: string | null;
	photos: { url: string; isMain: boolean; order: number }[];
	objective?: string | null; ownershipType?: string | null;
	plotSizeSqm?: number | null; titleDocType?: string | null;
	surveyAvailable?: boolean | null; topography?: string | null;
	accessRoad?: string | null; fencing?: boolean | null;
	floorAreaSqm?: number | null; floorLevel?: string | null;
	units?: number | null; fitOutState?: string | null;
	listingType?: string | null;
}

/* ------------------------------------------------------------------ */

export default function EditPropertyPageOuter({ params }: { params: { id: string } }) {
	return (
		<Suspense fallback={<div className="fixed inset-0 z-[80] flex items-center justify-center bg-bg-page"><Loader2 className="h-6 w-6 animate-spin text-black/30" /></div>}>
			<EditPropertyPage id={params.id} />
		</Suspense>
	);
}

function EditPropertyPage({ id }: { id: string }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const returnTo = searchParams.get("returnTo") ?? "/listing/properties";
	const user = useUserStore((s) => s.user);
	const data = useListPropertyStore((s) => s.data);
	const replaceAll = useListPropertyStore((s) => s.replaceAll);
	const reset = useListPropertyStore((s) => s.reset);

	const [hydrating, setHydrating] = useState(true);
	const [saving, setSaving] = useState(false);
	const [activeKey, setActiveKey] = useState<string>("");
	const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

	const initials = user?.name ? getInitials(user.name) : "U";
	const firstName = user?.name?.split(" ")[0] ?? "Account";

	const editSteps = hydrating ? [] : getEditSteps(data);

	// Set initial active key once hydrated — skip disabled sections so we land on
	// the first actually-editable step (typically Location).
	useEffect(() => {
		if (!hydrating && editSteps.length > 0 && !activeKey) {
			const firstEditable = editSteps.find((s) => !DISABLED_KEYS.has(s.key));
			setActiveKey((firstEditable ?? editSteps[0]).key);
		}
	}, [hydrating, editSteps, activeKey]);

	useEffect(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => { document.body.style.overflow = prev; };
	}, []);

	/* Hydrate store from API */
	useEffect(() => {
		let cancelled = false;
		fetch(`/api/properties/${encodeURIComponent(id)}`)
			.then((r) => r.json())
			.then((json) => {
				if (cancelled) return;
				const p = json?.data as RawProperty | undefined;
				if (!p) throw new Error("Property not found");
				const sortedPhotos = [...p.photos].sort((a, b) => a.order - b.order);
				const mainIdx = sortedPhotos.findIndex((ph) => ph.isMain);

				// Infer objective from listingType if not directly available
				let objective: "SELL" | "RENT" | "LEASE" = "RENT";
				if (p.objective) objective = p.objective as "SELL" | "RENT" | "LEASE";
				else if (p.listingType === "SALE") objective = "SELL";
				else if (p.listingType === "LEASE") objective = "LEASE";

				replaceAll({
					data: {
						objective,
						role: null,
						propertyKind: (p.propertyKind as "RESIDENTIAL" | "COMMERCIAL" | "LAND" | "") ?? "RESIDENTIAL",
						title: p.title, propertyType: p.propertyType ?? "",
						bedrooms: p.bedrooms, bathrooms: p.bathrooms,
						briefDescription: p.description ?? "",
						size: p.size, yearBuilt: p.yearBuilt ?? null,
						furnishing: p.furnishing ?? "", floorNumber: p.floorNumber ?? "",
						condition: p.condition ?? "", ownershipType: p.ownershipType ?? "",
						city: p.city, area: p.area, lga: p.lga ?? "",
						state: "", zipCode: "", unit: "",
						streetAddress: p.streetAddress ?? "",
						fullAddressVisible: p.fullAddressVisible,
						latitude: p.latitude, longitude: p.longitude,
						geocodeAccuracy: p.geocodeAccuracy ?? "",
						amenities: p.amenities ?? [], customAmenities: p.customAmenities ?? [],
						parkingSpaces: p.parkingSpaces, powerBackup: p.powerBackup ?? "",
						waterSource: p.waterSource ?? "", internetReady: p.internetReady ?? false,
						floorAreaSqm: p.floorAreaSqm ?? null, floorLevel: p.floorLevel ?? "",
						units: p.units ?? null, fitOutState: p.fitOutState ?? "",
						plotSizeSqm: p.plotSizeSqm ?? null, titleDocType: p.titleDocType ?? "",
						surveyAvailable: p.surveyAvailable ?? false, topography: p.topography ?? "",
						accessRoad: p.accessRoad ?? "", fencing: p.fencing ?? false,
						photoUrls: sortedPhotos.map((ph) => ph.url),
						photoNames: sortedPhotos.map((_, i) => `photo-${i + 1}`),
						mainPhotoIndex: mainIdx >= 0 ? mainIdx : 0,
						rent: p.rent, rentPeriod: (p.rentPeriod as "MONTH" | "YEAR") ?? "YEAR",
						minimumLease: p.minimumLease ?? "",
						agencyFee: { mode: (p.agencyFeeMode as "FIXED" | "PERCENT") ?? "FIXED", value: p.agencyFee },
						legalFee: { mode: (p.legalFeeMode as "FIXED" | "PERCENT") ?? "FIXED", value: p.legalFee },
						cautionDeposit: p.cautionDeposit, serviceCharge: p.serviceCharge,
						serviceChargeIncludes: "",
						availability: (p.availabilityStatus as "AVAILABLE_NOW" | "AVAILABLE_FROM") ?? "AVAILABLE_NOW",
						availableFrom: p.availableFrom ? p.availableFrom.slice(0, 10) : "",
						salePrice: null, negotiable: p.negotiable, titleDocuments: "",
						leaseTerms: "", contactFirstName: "", contactLastName: "",
						contactEmail: "", contactPhone: "",
						offPlatformOwnerName: "", offPlatformOwnerPhone: "",
					},
					currentStep: 1, completedSteps: [],
				});
				setHydrating(false);
			})
			.catch((e) => {
				if (cancelled) return;
				toast.error(e instanceof Error ? e.message : "Could not load property");
				router.push(returnTo);
			});
		return () => { cancelled = true; };
	}, [id, replaceAll, router]);

	const handleSave = async () => {
		setSaving(true);
		try {
			const photos = data.photoUrls.map((url, i) => ({ url, isMain: i === data.mainPhotoIndex }));
			await listingsClient.update(id, {
				title: data.title,
				description: data.briefDescription || null,
				propertyType: data.propertyType || undefined,
				bedrooms: data.bedrooms ?? undefined,
				bathrooms: data.bathrooms ?? undefined,
				size: data.size ?? null,
				yearBuilt: data.yearBuilt ?? null,
				furnishing: data.furnishing || undefined,
				condition: data.condition || null,
				floorNumber: data.floorNumber || null,

				amenities: data.amenities,
				customAmenities: data.customAmenities,

				parkingSpaces: data.parkingSpaces ?? null,
				powerBackup: data.powerBackup || undefined,
				waterSource: data.waterSource || undefined,
				internetReady: data.internetReady ?? undefined,

				floorAreaSqm: data.floorAreaSqm ?? null,
				floorLevel: data.floorLevel || undefined,
				units: data.units ?? null,
				fitOutState: data.fitOutState || undefined,

				plotSizeSqm: data.plotSizeSqm ?? null,
				titleDocType: data.titleDocType || undefined,
				surveyAvailable: data.surveyAvailable ?? undefined,
				topography: data.topography || undefined,
				accessRoad: data.accessRoad || undefined,
				fencing: data.fencing ?? undefined,

				city: data.city,
				area: data.area,
				lga: data.lga || undefined,
				streetAddress: data.streetAddress || null,
				fullAddressVisible: data.fullAddressVisible,
				latitude: data.latitude ?? undefined,
				longitude: data.longitude ?? undefined,
				geocodeAccuracy: data.geocodeAccuracy || undefined,

				rent: data.rent ?? undefined,
				rentPeriod: data.rentPeriod,
				agencyFee: data.agencyFee?.value ?? null,
				agencyFeeMode: data.agencyFee?.mode ?? undefined,
				legalFee: data.legalFee?.value ?? null,
				legalFeeMode: data.legalFee?.mode ?? undefined,
				cautionDeposit: data.cautionDeposit ?? null,
				serviceCharge: data.serviceCharge ?? null,
				negotiable: data.negotiable,

				availabilityStatus: data.availability,
				availableFrom: data.availability === "AVAILABLE_FROM" && data.availableFrom ? data.availableFrom : null,
				minimumLease: data.minimumLease || null,
				photos,
			});
			toast.success("Listing updated");
			reset();
			router.push(returnTo);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save changes");
		} finally { setSaving(false); }
	};

	const handleClose = () => { reset(); router.push(returnTo); };

	if (hydrating) {
		return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-bg-page"><Loader2 className="h-6 w-6 animate-spin text-black/30" /></div>;
	}

	return (
		<div className="fixed inset-0 z-[80] flex flex-col bg-bg-page">
			{/* Header */}
			<header className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 bg-white px-4 md:px-8">
				<Link href="/listing/properties" onClick={(e) => { e.preventDefault(); handleClose(); }}
					className="flex items-center gap-2 text-[20px] font-semibold tracking-tight">
					<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#af2525] text-[12px] leading-none text-white">◆</span>
					<span className="text-black">uno</span>
				</Link>
				<div className="flex items-center gap-2">
					<span className="hidden text-[15px] text-black sm:inline">{firstName}</span>
					<div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#af2525]">
						{user?.photo ? (
							/* eslint-disable-next-line @next/next/no-img-element */
							<img src={user.photo} alt={user.name ?? "Profile"} className="absolute inset-0 h-full w-full object-cover" />
						) : (
							<span className="text-[13px] font-medium text-white">{initials}</span>
						)}
					</div>
				</div>
			</header>

			<div className="flex flex-1 min-h-0 overflow-hidden">
				{/* Desktop sidebar — 320px, visible at lg+ */}
				<aside className="hidden w-[320px] shrink-0 overflow-y-auto border-r border-black/10 bg-[#fafafa] px-4 py-5 lg:block">
					<button type="button" onClick={handleClose} className="mb-5 flex items-center gap-2 px-1">
						<span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#af2525]/10 text-[#af2525]">
							<ArrowLeft size={14} />
						</span>
						<h2 className="text-[17px] font-bold text-[#161515]">Edit Listing</h2>
					</button>
					<div className="flex flex-col gap-2">
						{editSteps.map((s) => (
							<SidebarCard key={s.key} stepKey={s.key} label={s.label}
								active={activeKey === s.key} data={data}
								disabled={DISABLED_KEYS.has(s.key)}
								onClick={() => setActiveKey(s.key)} />
						))}
					</div>
				</aside>

				{/* Main */}
				<main className="flex-1 overflow-y-auto">
					<div className="mx-auto w-full max-w-[760px] px-4 py-4 md:px-8 md:py-10">
						{/* Mobile/tablet header (below lg): back + title + save */}
						<div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
							<button type="button" onClick={handleClose} className="flex items-center gap-2">
								<span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#af2525]/10 text-[#af2525]">
									<ArrowLeft size={15} />
								</span>
								<span className="text-[16px] font-bold text-[#161515]">Edit Listing</span>
							</button>
							<button type="button" onClick={handleSave} disabled={saving}
								className="inline-flex h-[36px] items-center gap-1.5 rounded-[50px] bg-[#af2525] px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60">
								{saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
								{saving ? "Saving…" : "Save"}
							</button>
						</div>

						{/* Mobile/tablet section accordion (below lg) */}
						<div className="mb-5 lg:hidden">
							<button type="button"
								onClick={() => setMobileDrawerOpen((v) => !v)}
								className="flex w-full items-center justify-between rounded-[14px] border border-black/10 bg-white px-4 py-3 text-left shadow-sm">
								<div className="flex items-center gap-2">
									<span className="h-[7px] w-[7px] rounded-full bg-[#22c55e]" />
									<span className="text-[14px] font-semibold text-[#161515]">
										{editSteps.find((s) => s.key === activeKey)?.label ?? "Section"}
									</span>
								</div>
								<ChevronDown size={16} className={`text-black/40 transition-transform ${mobileDrawerOpen ? "rotate-180" : ""}`} />
							</button>
							{mobileDrawerOpen && (
								<div className="mt-2 flex flex-col gap-2">
									{editSteps.map((s) => (
										<SidebarCard key={s.key} stepKey={s.key} label={s.label}
											active={activeKey === s.key} data={data}
											disabled={DISABLED_KEYS.has(s.key)}
											onClick={() => { setActiveKey(s.key); setMobileDrawerOpen(false); }} />
									))}
								</div>
							)}
						</div>

						{/* Desktop save button (lg+) */}
						<div className="mb-6 hidden items-center justify-end lg:flex">
							<button type="button" onClick={handleSave} disabled={saving}
								className="inline-flex h-[38px] items-center gap-2 rounded-[50px] bg-[#af2525] px-6 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60">
								{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
								{saving ? "Saving…" : "Save"}
							</button>
						</div>

						{renderStepComponent(activeKey)}
					</div>
				</main>
			</div>
		</div>
	);
}

/* ================================================================== */
/*  Sidebar card                                                        */
/* ================================================================== */

function SidebarCard({ stepKey, label, active, data, disabled, onClick }: {
	stepKey: string; label: string; active: boolean; data: ListPropertyData; disabled?: boolean; onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-disabled={disabled || undefined}
			title={disabled ? "Not editable after submission" : undefined}
			className={`w-full rounded-[16px] border px-3 py-3 text-left transition-all ${
				disabled
					? "cursor-not-allowed border-black/[0.06] bg-black/[0.02] opacity-60"
					: active
						? "border-[#af2525]/20 bg-[#fff5f5] shadow-sm"
						: "border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
			}`}>
			<div className="mb-1 flex items-center gap-2">
				<span className={`h-[7px] w-[7px] shrink-0 rounded-full ${disabled ? "bg-black/20" : "bg-[#22c55e]"}`} />
				<span className="text-[13px] font-semibold text-[#161515]">{label}</span>
			</div>
			<div className="ml-[15px]"><StepPreview stepKey={stepKey} data={data} /></div>
		</button>
	);
}

/* ================================================================== */
/*  Per-step preview                                                    */
/* ================================================================== */

function StepPreview({ stepKey, data }: { stepKey: string; data: ListPropertyData }) {
	switch (stepKey) {
		case "overview": {
			const label = data.objective === "SELL" ? "For sale" : data.objective === "LEASE" ? "For lease" : data.objective === "RENT" ? "For rent" : "";
			return label ? <p className="text-[11px] text-black/55">{label}</p> : <Empty />;
		}
		case "kind": {
			if (!data.propertyKind) return <Empty />;
			return <p className="text-[11px] text-black/55">{humanize(data.propertyKind)}</p>;
		}
		case "location": {
			const parts = [data.streetAddress, data.area, data.lga, data.state].filter(Boolean);
			if (!parts.length) return <Empty />;
			return <p className="text-[11px] leading-[1.4] text-black/55">{parts.join(", ")}</p>;
		}
		case "property-info": {
			if (!data.propertyType && data.bedrooms === null) return <Empty />;
			return (
				<div className="flex flex-col gap-1.5">
					{data.propertyType && <p className="text-[11px] text-black/55">{humanize(data.propertyType)}</p>}
					<div className="flex flex-wrap gap-1">
						{data.bathrooms !== null && (
							<span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-[2px] text-[10px] text-black/60">
								<Bath size={10} />{data.bathrooms} bath
							</span>
						)}
						{data.propertyType && (
							<span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-[2px] text-[10px] text-black/60">
								<Home size={10} />{humanize(data.propertyType)}
							</span>
						)}
					</div>
				</div>
			);
		}
		case "land-details": {
			const lines: string[] = [];
			if (data.plotSizeSqm) lines.push(`${data.plotSizeSqm} sqm`);
			if (data.titleDocType) lines.push(humanize(data.titleDocType));
			if (data.topography) lines.push(humanize(data.topography));
			if (!lines.length) return <Empty />;
			return <div className="flex flex-col">{lines.map((l, i) => <p key={i} className="text-[11px] leading-[1.6] text-black/55">{l}</p>)}</div>;
		}
		case "description": {
			const lines: string[] = [];
			if (data.yearBuilt) lines.push(`Year Built - ${data.yearBuilt}`);
			if (data.furnishing) lines.push(`Furnishing - ${humanize(data.furnishing)}`);
			if (data.condition) lines.push(humanize(data.condition));
			if (data.ownershipType) lines.push(humanize(data.ownershipType));
			if (!lines.length) return <Empty />;
			return <div className="flex flex-col">{lines.map((l, i) => <p key={i} className="text-[11px] leading-[1.6] text-black/55">{l}</p>)}</div>;
		}
		case "amenities": {
			const kind: PropertyKind = (data.propertyKind as PropertyKind) || "RESIDENTIAL";
			const groups = AMENITIES_BY_KIND[kind] ?? AMENITIES_BY_KIND.RESIDENTIAL;
			const rows = groups.map((g) => ({
				label: g.group,
				count: `${data.amenities.filter((a) => g.items.includes(a)).length}/${g.items.length}`,
			}));
			if (data.customAmenities.length) rows.push({ label: "Custom Features", count: `${data.customAmenities.length}/${data.customAmenities.length}` });
			if (!rows.length) return <Empty />;
			return (
				<div className="flex flex-col gap-[2px]">
					{rows.map((r) => (
						<div key={r.label} className="flex items-center justify-between gap-2">
							<span className="text-[11px] text-black/55">{r.label}</span>
							<span className="text-[11px] font-medium text-black/55">- {r.count}</span>
						</div>
					))}
				</div>
			);
		}
		case "photos": {
			if (!data.photoUrls.length) return <Empty />;
			const thumbs = data.photoUrls.slice(0, 3);
			return (
				<div className="flex gap-1.5">
					{thumbs.map((url, i) => (
						<div key={i} className="h-[38px] w-[44px] overflow-hidden rounded-[6px] bg-black/5">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={url} alt={`Thumb ${i + 1}`} className="h-full w-full object-cover" />
						</div>
					))}
					{data.photoUrls.length > 3 && (
						<div className="flex h-[38px] w-[44px] items-center justify-center rounded-[6px] bg-black/5">
							<span className="text-[10px] font-medium text-black/50">+{data.photoUrls.length - 3}</span>
						</div>
					)}
				</div>
			);
		}
		case "pricing": {
			if (!data.rent) return <Empty />;
			const period = data.rentPeriod === "MONTH" ? "monthly" : "yearly";
			const lines = [`${naira(data.rent)} ${period} rent`];
			if (data.cautionDeposit) lines.push(`${naira(data.cautionDeposit)} caution fee`);
			if (data.legalFee?.value) lines.push(data.legalFee.mode === "PERCENT" ? `${data.legalFee.value}% Legal fee` : `${naira(data.legalFee.value)} Legal fee`);
			if (data.agencyFee?.value) lines.push(data.agencyFee.mode === "PERCENT" ? `${data.agencyFee.value}% Agent fee` : `${naira(data.agencyFee.value)} Agent fee`);
			return <div className="flex flex-col">{lines.map((l, i) => <p key={i} className="text-[11px] leading-[1.6] text-black/55">{l}</p>)}</div>;
		}
		case "lease-terms":
			return data.leaseTerms ? <p className="text-[11px] text-black/55">Terms & Conditions is set</p> : <Empty />;
		case "contact": {
			const lines = [data.contactEmail, data.contactPhone].filter(Boolean);
			if (!lines.length) return <Empty />;
			return <div className="flex flex-col">{lines.map((l, i) => <p key={i} className="text-[11px] leading-[1.4] text-black/55">{l}</p>)}</div>;
		}
		default: return <Empty />;
	}
}

function Empty() { return <p className="text-[11px] italic text-black/30">Not set</p>; }
function humanize(v: string) { return v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); }
function naira(n: number) { return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n); }
