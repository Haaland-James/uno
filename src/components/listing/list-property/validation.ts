import type { ListPropertyData } from "@/stores/listPropertyStore";

export function isStepValid(stepKey: string, data: ListPropertyData): boolean {
	const isLand = data.propertyKind === "LAND";
	const isCommercial = data.propertyKind === "COMMERCIAL";

	switch (stepKey) {
		case "overview":
			return !!data.objective && !!data.role;
		case "kind":
			return !!data.propertyKind && data.propertyType.trim().length > 0;
		case "location":
			return (
				data.state.trim().length > 0 &&
				data.lga.trim().length > 0 &&
				data.area.trim().length > 0 &&
				data.streetAddress.trim().length > 0
			);
		case "property-info":
			if (isCommercial) {
				return (
					data.title.trim().length >= 10 &&
					data.title.trim().length <= 100 &&
					typeof data.floorAreaSqm === "number" &&
					data.floorAreaSqm > 0 &&
					data.fitOutState.trim().length > 0
				);
			}
			return (
				data.title.trim().length >= 10 &&
				data.title.trim().length <= 100 &&
				data.bedrooms !== null &&
				data.bathrooms !== null
			);
		case "land-details":
			return (
				data.title.trim().length >= 10 &&
				data.title.trim().length <= 100 &&
				typeof data.plotSizeSqm === "number" &&
				data.plotSizeSqm > 0 &&
				data.titleDocType.trim().length > 0
			);
		case "description":
			// Description step is skipped for Land flow; here only for Residential / Commercial.
			return (
				data.condition.trim().length > 0 && data.ownershipType.trim().length > 0
			);
		case "amenities":
			// Land doesn't go through this step. For others, allow zero amenities — the
			// structured facts (parking, water, power) carry the weight now.
			return true;
		case "photos":
			return data.photoUrls.length >= 5;
		case "pricing":
			if (data.objective === "SELL") {
				return typeof data.salePrice === "number" && data.salePrice > 0;
			}
			// Land typically lists for sale, but if it's listed for rent/lease, we still
			// require rent + minimum lease the same way.
			return (
				typeof data.rent === "number" &&
				data.rent >= 10000 &&
				(isLand || data.minimumLease.trim().length > 0)
			);
		case "lease-terms":
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
