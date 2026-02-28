import { NextResponse } from "next/server";

export async function GET() {
	// TODO: Replace with actual database query
	return NextResponse.json({
		message: "Properties API - to be implemented",
		data: [],
	});
}

export async function POST() {
	// TODO: Implement property creation
	return NextResponse.json(
		{ message: "Property creation - to be implemented" },
		{ status: 201 }
	);
}
