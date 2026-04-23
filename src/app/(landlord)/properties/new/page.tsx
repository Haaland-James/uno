"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useListPropertyStore } from "@/stores/listPropertyStore";
import { useUserStore } from "@/stores/userStore";
import { getInitials } from "@/lib/utils";
import { getSteps, getCountedStepInfo } from "@/components/landlord/list-property/steps";
import { isStepValid } from "@/components/landlord/list-property/validation";
import { StepIndicator } from "@/components/landlord/list-property/StepIndicator";
import { MobileStepBar } from "@/components/landlord/list-property/MobileStepBar";
import { WizardFooter } from "@/components/landlord/list-property/WizardFooter";
import { DraftWarningModal } from "@/components/landlord/list-property/DraftWarningModal";
import { ObjectiveStep } from "@/components/landlord/list-property/steps/ObjectiveStep";
import { LocationStep } from "@/components/landlord/list-property/steps/LocationStep";
import { PropertyInfoStep } from "@/components/landlord/list-property/steps/PropertyInfoStep";
import { DescriptionStep } from "@/components/landlord/list-property/steps/DescriptionStep";
import { AmenitiesStep } from "@/components/landlord/list-property/steps/AmenitiesStep";
import { PhotosStep } from "@/components/landlord/list-property/steps/PhotosStep";
import { PricingStep } from "@/components/landlord/list-property/steps/PricingStep";
import { LeaseTermsStep } from "@/components/landlord/list-property/steps/LeaseTermsStep";
import { ContactStep } from "@/components/landlord/list-property/steps/ContactStep";
import { ReviewStep } from "@/components/landlord/list-property/steps/ReviewStep";

export default function NewPropertyPage() {
	const router = useRouter();
	const user = useUserStore((s) => s.user);
	const data = useListPropertyStore((s) => s.data);
	const currentStep = useListPropertyStore((s) => s.currentStep);
	const completedSteps = useListPropertyStore((s) => s.completedSteps);
	const setStep = useListPropertyStore((s) => s.setStep);
	const markCompleted = useListPropertyStore((s) => s.markCompleted);
	const reset = useListPropertyStore((s) => s.reset);

	const steps = getSteps(data.objective);
	const safeIdx = Math.min(Math.max(currentStep - 1, 0), steps.length - 1);
	const currentStepDef = steps[safeIdx];
	const isReview = currentStepDef.key === "review";
	const canNext = isStepValid(currentStepDef.key, data);
	const countedInfo = getCountedStepInfo(safeIdx, data.objective);

	const [draftOpen, setDraftOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const initials = user?.name ? getInitials(user.name) : "U";
	const firstName = user?.name?.split(" ")[0] ?? "Account";

	// Lock body scroll while wizard is mounted
	useEffect(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, []);

	const goNext = () => {
		if (!canNext) return;
		markCompleted(safeIdx);
		if (safeIdx < steps.length - 1) setStep(safeIdx + 2);
	};

	const goBack = () => {
		if (safeIdx > 0) setStep(safeIdx);
	};

	const goToStep = (idx: number) => setStep(idx + 1);

	const handleClose = () => setDraftOpen(true);

	const handleDiscard = () => {
		reset();
		setDraftOpen(false);
		router.push("/properties");
	};

	const handleSaveDraft = () => {
		// Already persisted via Zustand persist middleware on every change.
		setDraftOpen(false);
		router.push("/properties");
	};

	const handleSubmit = async () => {
		setSubmitting(true);
		try {
			await fetch("/api/properties", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}).catch(() => null);
			reset();
			router.push("/properties");
		} finally {
			setSubmitting(false);
		}
	};

	const renderStep = () => {
		switch (currentStepDef.key) {
			case "overview":
				return <ObjectiveStep />;
			case "location":
				return <LocationStep />;
			case "property-info":
				return <PropertyInfoStep />;
			case "description":
				return <DescriptionStep />;
			case "amenities":
				return <AmenitiesStep />;
			case "photos":
				return <PhotosStep />;
			case "pricing":
				return <PricingStep />;
			case "lease-terms":
				return <LeaseTermsStep />;
			case "contact":
				return <ContactStep />;
			case "review":
				return <ReviewStep onEdit={goToStep} />;
			default:
				return null;
		}
	};

	return (
		<div className="fixed inset-0 z-[80] flex flex-col bg-bg-page">
			{/* Top bar */}
			<header className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 bg-white px-4 md:px-8">
				<Link href="/properties" className="flex items-center gap-2 text-[20px] font-semibold tracking-tight">
					<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#af2525] text-[12px] leading-none text-white">
						◆
					</span>
					<span className="text-black">uno</span>
				</Link>
				<div className="flex items-center gap-2">
					<span className="hidden text-[15px] text-black sm:inline">{firstName}</span>
					<div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#af2525]">
						{user?.photo ? (
							/* eslint-disable-next-line @next/next/no-img-element */
							<img
								src={user.photo}
								alt={user.name ?? "Profile"}
								className="absolute inset-0 h-full w-full object-cover"
							/>
						) : (
							<span className="text-[13px] font-medium text-white">{initials}</span>
						)}
					</div>
				</div>
			</header>

			{/* Mobile step bar */}
			<MobileStepBar
				steps={steps}
				currentStepIndex={safeIdx}
				completedSteps={completedSteps}
				onStepClick={goToStep}
			/>

			{/* Body */}
			<div className="flex flex-1 min-h-0 overflow-hidden">
				{/* Desktop sidebar */}
				<aside className="hidden w-[260px] shrink-0 overflow-y-auto border-r border-black/10 bg-white p-8 md:block">
					<StepIndicator
						steps={steps}
						currentStepIndex={safeIdx}
						completedSteps={completedSteps}
						onStepClick={goToStep}
					/>
				</aside>

				{/* Content */}
				<main className="flex-1 overflow-y-auto">
					<div className="mx-auto w-full max-w-[640px] px-4 py-6 md:px-8 md:py-10">
						<div className="mb-4 flex items-center justify-between">
							{countedInfo ? (
								<p className="text-[13px] text-black/60">
									Step {countedInfo.current} of {countedInfo.total}
								</p>
							) : (
								<span />
							)}
							<button
								type="button"
								onClick={handleClose}
								className="inline-flex h-9 items-center justify-center rounded-[50px] border border-black/15 bg-white px-4 text-[13px] font-semibold text-black hover:bg-black/5"
							>
								Close
							</button>
						</div>
						{renderStep()}
					</div>
				</main>
			</div>

			{/* Footer */}
			<WizardFooter
				onBack={goBack}
				onNext={isReview ? handleSubmit : goNext}
				canBack={safeIdx > 0}
				canNext={isReview ? !submitting : canNext}
				nextLabel={isReview ? (submitting ? "Submitting…" : "Submit Listing") : "Next"}
				hideBack={safeIdx === 0}
			/>

			<DraftWarningModal
				open={draftOpen}
				onClose={() => setDraftOpen(false)}
				onSaveDraft={handleSaveDraft}
				onDiscard={handleDiscard}
			/>
		</div>
	);
}
