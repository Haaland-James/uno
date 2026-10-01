/**
 * Commercial listings ask "Floor Area" and "Floor Level" in the Property info step,
 * and used to ask the same two things again in the Description step ("Property
 * Size", "Floor"). The Description-step copies are now hidden for commercial.
 *
 * The public listing page reads `size` and `floorNumber` (not floorAreaSqm /
 * floorLevel), so the answers from the Property info step are mirrored into them:
 * nothing disappears from the page, and the data model and API are unchanged.
 */
export const commercialFloorAreaPatch = (value: number | null) => ({ floorAreaSqm: value, size: value });
export const commercialFloorLevelPatch = (value: string) => ({ floorLevel: value, floorNumber: value });
