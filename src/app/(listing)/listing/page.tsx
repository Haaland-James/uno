import { redirect } from "next/navigation";

// `/listing` is not a real page — bookmarks and stale links land here. Send the
// visitor straight into the listing wizard.
export default function ListingIndex() {
	redirect("/listing/properties/new");
}
