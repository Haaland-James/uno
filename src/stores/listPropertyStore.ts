import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FeeValue } from "@/components/ui/FeeInput";

export type ListingObjective = "SELL" | "RENT" | "LEASE";
export type ListerRole = "OWNER" | "REPRESENTATIVE";

export interface ListPropertyData {
	// Overview
	objective: ListingObjective | null;
	role: ListerRole | null;

	// Kind / Type (Phase 2 wires KindStep; field exists now so persist is forward-compat)
	propertyKind: "RESIDENTIAL" | "COMMERCIAL" | "LAND" | "";

	// Location
	state: string;
	zipCode: string;
	streetAddress: string;
	unit: string;
	city: string;
	area: string;
	lga: string;
	latitude: number | null;
	longitude: number | null;
	geocodeAccuracy: string;
	fullAddressVisible: boolean;

	// Property Info
	title: string;
	propertyType: string;
	bedrooms: number | null;
	bathrooms: number | null;
	briefDescription: string;

	// Description
	size: number | null;
	yearBuilt: number | null;
	furnishing: string;
	floorNumber: string;
	condition: string;
	ownershipType: string;

	// Amenities
	amenities: string[];
	customAmenities: string[];

	// Structured facts (alongside boolean amenities)
	parkingSpaces: number | null;
	powerBackup: string;
	waterSource: string;
	internetReady: boolean;

	// Commercial-specific
	floorAreaSqm: number | null;
	floorLevel: string;
	units: number | null;
	fitOutState: string;

	// Land-specific
	plotSizeSqm: number | null;
	titleDocType: string;
	surveyAvailable: boolean;
	topography: string;
	accessRoad: string;
	fencing: boolean;

	// Photos
	// `photoNames` is just filenames for label display (transient, stripped on persist).
	// `photoUrls` is the array of Cloudinary `secure_url` strings — persisted so the user
	// can resume the wizard later without re-uploading.
	photoNames: string[];
	photoUrls: string[];
	mainPhotoIndex: number;

	// Pricing — Rent/Lease
	rent: number | null;
	rentPeriod: "MONTH" | "YEAR";
	minimumLease: string;
	agencyFee: FeeValue;
	legalFee: FeeValue;
	cautionDeposit: number | null;
	serviceCharge: number | null;
	serviceChargeIncludes: string;
	availability: "AVAILABLE_NOW" | "AVAILABLE_FROM";
	availableFrom: string;

	// Pricing — Sell
	salePrice: number | null;
	negotiable: boolean;
	titleDocuments: string;

	// Lease Terms
	leaseTerms: string;

	// Contact
	contactFirstName: string;
	contactLastName: string;
	contactEmail: string;
	contactPhone: string;

	// Off-platform owner (in-house agents only). When the lister is a UNO
	// agent acting on behalf of a landlord who isn't on UNO, these capture
	// the real owner's contact info for the agent's records. NEVER shown
	// to renters; populated only on the OwnerStep which is hidden from
	// regular landlords.
	offPlatformOwnerName: string;
	offPlatformOwnerPhone: string;
}

const initialData: ListPropertyData = {
	objective: null,
	role: null,
	propertyKind: "",
	state: "",
	zipCode: "",
	streetAddress: "",
	unit: "",
	city: "",
	area: "",
	lga: "",
	latitude: null,
	longitude: null,
	geocodeAccuracy: "",
	fullAddressVisible: false,
	title: "",
	propertyType: "",
	bedrooms: null,
	bathrooms: null,
	briefDescription: "",
	size: null,
	yearBuilt: null,
	furnishing: "",
	floorNumber: "",
	condition: "",
	ownershipType: "",
	amenities: [],
	customAmenities: [],
	parkingSpaces: null,
	powerBackup: "",
	waterSource: "",
	internetReady: false,
	floorAreaSqm: null,
	floorLevel: "",
	units: null,
	fitOutState: "",
	plotSizeSqm: null,
	titleDocType: "",
	surveyAvailable: false,
	topography: "",
	accessRoad: "",
	fencing: false,
	photoNames: [],
	photoUrls: [],
	mainPhotoIndex: 0,
	rent: null,
	rentPeriod: "YEAR",
	minimumLease: "",
	agencyFee: { mode: "FIXED", value: null },
	legalFee: { mode: "FIXED", value: null },
	cautionDeposit: null,
	serviceCharge: null,
	serviceChargeIncludes: "",
	availability: "AVAILABLE_NOW",
	availableFrom: "",
	salePrice: null,
	negotiable: false,
	titleDocuments: "",
	leaseTerms: "",
	contactFirstName: "",
	contactLastName: "",
	contactEmail: "",
	contactPhone: "",
	offPlatformOwnerName: "",
	offPlatformOwnerPhone: "",
};

interface ListPropertyState {
	data: ListPropertyData;
	currentStep: number;
	completedSteps: number[];

	updateData: (patch: Partial<ListPropertyData>) => void;
	setStep: (step: number) => void;
	markCompleted: (step: number) => void;
	reset: () => void;
	replaceAll: (snap: { data: ListPropertyData; currentStep: number; completedSteps: number[] }) => void;
}

/** Coerce any persisted value into a valid FeeValue (handles legacy `number | null`). */
function coerceFee(input: unknown): FeeValue {
	if (input && typeof input === "object" && "mode" in input && "value" in input) {
		const f = input as { mode?: unknown; value?: unknown };
		const mode = f.mode === "PERCENT" ? "PERCENT" : "FIXED";
		const value =
			typeof f.value === "number" && Number.isFinite(f.value) ? f.value : null;
		return { mode, value };
	}
	if (typeof input === "number" && Number.isFinite(input)) {
		return { mode: "FIXED", value: input };
	}
	return { mode: "FIXED", value: null };
}

export const useListPropertyStore = create<ListPropertyState>()(
	persist(
		(set) => ({
			data: initialData,
			currentStep: 1,
			completedSteps: [],

			updateData: (patch) =>
				set((state) => ({ data: { ...state.data, ...patch } })),

			setStep: (step) => set({ currentStep: step }),

			markCompleted: (step) =>
				set((state) => ({
					completedSteps: state.completedSteps.includes(step)
						? state.completedSteps
						: [...state.completedSteps, step].sort((a, b) => a - b),
				})),

			reset: () =>
				set({ data: initialData, currentStep: 1, completedSteps: [] }),

			replaceAll: (snap) =>
				set({
					// Merge against initialData so any new fields added since the draft was
					// saved have sane defaults instead of undefined.
					data: { ...initialData, ...snap.data },
					currentStep: snap.currentStep,
					completedSteps: snap.completedSteps,
				}),
		}),
		{
			name: "uno-list-property-draft",
			version: 3,
			partialize: (state) => ({
				data: { ...state.data, photoNames: [] as string[] },
				currentStep: state.currentStep,
				completedSteps: state.completedSteps,
			}),
			// Default merge is shallow, so adding fields to `initialData` (e.g. `lga`,
			// `latitude`) leaves them `undefined` on already-persisted drafts and
			// validation crashes on `.trim()`. Backfill missing fields from initialData.
			merge: (persisted, current) => {
				const p = (persisted ?? {}) as Partial<ListPropertyState>;
				return {
					...current,
					...p,
					data: { ...initialData, ...(p.data ?? {}) },
				};
			},
			migrate: (persistedState: unknown, version) => {
				const empty = {
					data: initialData,
					currentStep: 1,
					completedSteps: [] as number[],
				};
				if (!persistedState || typeof persistedState !== "object") return empty;
				const s = persistedState as {
					data?: Partial<ListPropertyData>;
					currentStep?: number;
					completedSteps?: number[];
				};
				const data: ListPropertyData = { ...initialData, ...(s.data ?? {}) };
				if (version < 2) {
					data.propertyKind =
						((s.data as { propertyKind?: string } | undefined)?.propertyKind as ListPropertyData["propertyKind"]) ?? "";
					data.agencyFee = coerceFee((s.data as { agencyFee?: unknown } | undefined)?.agencyFee);
					data.legalFee = coerceFee((s.data as { legalFee?: unknown } | undefined)?.legalFee);
				}
				return {
					data,
					currentStep: s.currentStep ?? 1,
					completedSteps: s.completedSteps ?? [],
				};
			},
		}
	)
);
