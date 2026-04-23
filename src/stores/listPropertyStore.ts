import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ListingObjective = "SELL" | "RENT" | "LEASE";
export type ListerRole = "OWNER" | "REPRESENTATIVE";

export interface ListPropertyData {
	// Overview
	objective: ListingObjective | null;
	role: ListerRole | null;

	// Location
	state: string;
	zipCode: string;
	streetAddress: string;
	unit: string;
	city: string;
	area: string;

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

	// Photos (object URLs only — stub; not persisted)
	photoNames: string[];
	mainPhotoIndex: number;

	// Pricing — Rent/Lease
	rent: number | null;
	rentPeriod: "MONTH" | "YEAR";
	minimumLease: string;
	agencyFee: number | null;
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
}

const initialData: ListPropertyData = {
	objective: null,
	role: null,
	state: "",
	zipCode: "",
	streetAddress: "",
	unit: "",
	city: "",
	area: "",
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
	photoNames: [],
	mainPhotoIndex: 0,
	rent: null,
	rentPeriod: "YEAR",
	minimumLease: "",
	agencyFee: null,
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
};

interface ListPropertyState {
	data: ListPropertyData;
	currentStep: number;
	completedSteps: number[];

	updateData: (patch: Partial<ListPropertyData>) => void;
	setStep: (step: number) => void;
	markCompleted: (step: number) => void;
	reset: () => void;
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
		}),
		{
			name: "uno-list-property-draft",
			partialize: (state) => ({
				data: { ...state.data, photoNames: [] },
				currentStep: state.currentStep,
				completedSteps: state.completedSteps,
			}),
		}
	)
);
