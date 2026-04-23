import type { ListPropertyData } from "@/stores/listPropertyStore";

export function isStepValid(stepKey: string, data: ListPropertyData): boolean {
	switch (stepKey) {
		case "overview":
			return !!data.objective && !!data.role;
		case "location":
			return (
				data.state.trim().length > 0 &&
				data.streetAddress.trim().length > 0 &&
				data.city.trim().length > 0
			);
		case "property-info":
			return (
				data.title.trim().length >= 10 &&
				data.title.trim().length <= 100 &&
				data.propertyType.trim().length > 0 &&
				data.bedrooms !== null &&
				data.bathrooms !== null
			);
		case "description":
			return (
				data.condition.trim().length > 0 && data.ownershipType.trim().length > 0
			);
		case "amenities":
			return data.amenities.length > 0 || data.customAmenities.length > 0;
		case "photos":
			return data.photoNames.length >= 5;
		case "pricing":
			if (data.objective === "SELL") {
				return typeof data.salePrice === "number" && data.salePrice > 0;
			}
			return (
				typeof data.rent === "number" &&
				data.rent >= 10000 &&
				data.minimumLease.trim().length > 0
			);
		case "lease-terms":
			// Optional in design ("Property Lease Terms (optional)") — always valid.
			return true;
		case "contact":
			return (
				data.contactFirstName.trim().length > 0 &&
				data.contactLastName.trim().length > 0 &&
				/^\S+@\S+\.\S+$/.test(data.contactEmail) &&
				data.contactPhone.trim().length >= 7
			);
		case "review":
			return true;
		default:
			return false;
	}
}
