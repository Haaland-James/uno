/** Where a header's logo goes: signed-in users land on their feed, guests on the homepage. */
export function logoHref(isAuthed: boolean): string {
	return isAuthed ? "/feed" : "/";
}
