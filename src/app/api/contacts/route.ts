import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({
		message: "Contacts API - to be implemented",
		data: [],
	});
}

export async function POST() {
	return NextResponse.json(
		{ message: "Contact request creation - to be implemented" },
		{ status: 201 }
	);
}
