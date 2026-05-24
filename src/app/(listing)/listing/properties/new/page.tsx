"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useListPropertyStore, type ListPropertyData } from "@/stores/listPropertyStore";
import { useUserStore } from "@/stores/userStore";
import { getInitials } from "@/lib/utils";
import { listingsClient, draftsClient } from "@/lib/clients/listings";
import { invalidateHasListings } from "@/hooks/useHasListings";
import { toast } from "@/stores/toastStore";
import { getSteps, getCountedStepInfo } from "@/components/listing/list-property/steps";
import { isStepValid } from "@/components/listing/list-property/validation";
import { StepIndicator } from "@/components/listing/list-property/StepIndicator";
import { MobileStepBar } from "@/components/listing/list-property/MobileStepBar";
import { WizardFooter } from "@/components/listing/list-property/WizardFooter";
import { DraftWarningModal } from "@/components/listing/list-property/DraftWarningModal";
import { ObjectiveStep } from "@/components/listing/list-property/steps/ObjectiveStep";
import { KindStep } from "@/components/listing/list-property/steps/KindStep";
import { LocationStep } from "@/components/listing/list-property/steps/LocationStep";
import { PropertyInfoStep } from "@/components/listing/list-property/steps/PropertyInfoStep";
import { LandDetailsStep } from "@/components/listing/list-property/steps/LandDetailsStep";
import { DescriptionStep } from "@/components/listing/list-property/steps/DescriptionStep";
import { AmenitiesStep } from "@/components/listing/list-property/steps/AmenitiesStep";
import { PhotosStep } from "@/components/listing/list-property/steps/PhotosStep";
import { PricingStep } from "@/components/listing/list-property/steps/PricingStep";
import { LeaseTermsStep } from "@/components/listing/list-property/steps/LeaseTermsStep";
import { ContactStep } from "@/components/listing/list-property/steps/ContactStep";
import { ReviewStep } from "@/components/listing/list-property/steps/ReviewStep";

export default function NewPropertyPageOuter() {
	return (
		<Suspense
			fallback={
				<div className="fixed inset-0 z-[80] flex items-center justify-center bg-bg-page">
					<div className="text-[14px] text-black/60">Loading…</div>
				</div>
			}
		>
			<NewPropertyPage />
		</Suspense>
	);
}

function NewPropertyPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const draftIdParam = searchParams.get("draft");
	const user = useUserStore((s) => s.user);
	const data = useListPropertyStore((s) => s.data);
	const currentStep = useListPropertyStore((s) => s.currentStep);
	const completedSteps = useListPropertyStore((s) => s.completedSteps);
	const setStep = useListPropertyStore((s) => s.setStep);
	const markCompleted = useListPropertyStore((s) => s.markCompleted);
	const reset = useListPropertyStore((s) => s.reset);
	const replaceAll = useListPropertyStore((s) => s.replaceAll);

	// Tracks the draftId we've loaded from / are saving back to. Initialised from the URL
	// so the user can deep-link to a specific draft from My Listings.
	const draftIdRef = useRef<string | null>(draftIdParam);
	const [hydrating, setHydrating] = useState<boolean>(!!draftIdParam);
	// Single in-flight save promise. Every write — autosave or Save Draft —
	// chains onto this so writes never race or get dropped.
	const inFlightSaveRef = useRef<Promise<void> | null>(null);
	// Snapshot of the latest data/step/completed for autosave to read without
	// re-firing the effect on every keystroke.
	const latestSnapRef = useRef<{
		data: ListPropertyData;
		currentStep: number;
		completedSteps: number[];
	} | null>(null);

	// Hydrate from server draft on mount when ?draft=ID is present.
	// If the draft is gone (404) we don't bail — Zustand's persisted local copy
	// may still have the user's work, so we drop the ?draft id and start a fresh
	// server draft on the next autosave instead of stranding the user.
	useEffect(() => {
		if (!draftIdParam) return;
		let cancelled = false;
		draftsClient
			.get(draftIdParam)
			.then((d) => {
				if (cancelled) return;
				replaceAll({
					data: d.data as unknown as ListPropertyData,
					currentStep: d.currentStep,
					completedSteps: d.completedSteps,
				});
				draftIdRef.current = d.id;
				setHydrating(false);
			})
			.catch((e) => {
				if (cancelled) return;
				const msg = e instanceof Error ? e.message : "";
				const missing = /not found/i.test(msg);
				if (missing) {
					// Drop the stale id and continue with whatever local state we have.
					toast.info("That draft is no longer available — starting fresh.");
					draftIdRef.current = null;
					setHydrating(false);
				} else {
					toast.error(msg || "Could not load draft");
					router.push("/listing/properties");
				}
			});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [draftIdParam]);

	const wizardKind = (data.propertyKind || "") as "RESIDENTIAL" | "COMMERCIAL" | "LAND" | "";
	const steps = getSteps(data.objective, wizardKind);
	const safeIdx = Math.min(Math.max(currentStep - 1, 0), steps.length - 1);
	const currentStepDef = steps[safeIdx];
	const isReview = currentStepDef.key === "review";
	const canNext = isStepValid(currentStepDef.key, data);
	const countedInfo = getCountedStepInfo(safeIdx, data.objective, wizardKind);

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

	// Keep a fresh snapshot for autosave (avoids re-firing the autosave effect on
	// every keystroke — it should only fire on step completions).
	useEffect(() => {
		latestSnapRef.current = { data, currentStep, completedSteps };
	}, [data, currentStep, completedSteps]);

	// Serialized save. Autosave and the Save Draft button both call this — every
	// write chains onto the previous one via inFlightSaveRef, so writes never race
	// or get dropped. On 404 (draft was deleted server-side) we forget the id and
	// retry as a CREATE on the next save instead of giving up.
	const saveDraftNow = useCallback(async (): Promise<void> => {
		const prev = inFlightSaveRef.current ?? Promise.resolve();
		const next = prev
			.catch(() => undefined)
			.then(async () => {
				const snap = latestSnapRef.current;
				if (!snap) return;
				if (draftIdRef.current) {
					try {
						await draftsClient.update(draftIdRef.current, snap);
					} catch (e) {
						const msg = e instanceof Error ? e.message : "";
						if (/not found/i.test(msg)) {
							draftIdRef.current = null;
							const created = await draftsClient.create(snap);
							draftIdRef.current = created.id;
							invalidateHasListings();
							return;
						}
						throw e;
					}
				} else {
					const created = await draftsClient.create(snap);
					draftIdRef.current = created.id;
					invalidateHasListings();
				}
			});
		inFlightSaveRef.current = next.finally(() => {
			if (inFlightSaveRef.current === next) inFlightSaveRef.current = null;
		});
		await next;
	}, []);

	// Autosave on every step completion. Best-effort: errors here are swallowed
	// (local Zustand persist still has the user's data; Save Draft surfaces errors).
	useEffect(() => {
		if (hydrating) return;
		if (completedSteps.length === 0) return;
		saveDraftNow().catch(() => undefined);
	}, [completedSteps.length, hydrating, saveDraftNow]);

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
		// Discard only resets in-session local state. A saved server draft is preserved
		// on purpose — to permanently delete it the user uses the kebab "Delete Draft"
		// from the listing card. (Closing a doc shouldn't delete the doc.)
		reset();
		setDraftOpen(false);
		router.push("/listing/properties");
	};

	const handleSaveDraft = async () => {
		setDraftOpen(false);
		try {
			await saveDraftNow();
			invalidateHasListings();
			reset();
			toast.success("Draft saved");
			router.push("/listing/properties");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save draft");
		}
	};

	const handleSubmit = async () => {
		if (!data.objective) {
			toast.error("Please choose what you're listing");
			return;
		}
		if (data.photoUrls.length < 5) {
			toast.error("Add at least 5 photos before submitting");
			return;
		}
		setSubmitting(true);
		try {
			// Drain any in-flight autosave first so we don't leak a draft created
			// just after we delete it below.
			if (inFlightSaveRef.current) {
				await inFlightSaveRef.current.catch(() => undefined);
			}
			const photos = data.photoUrls.map((url, i) => ({
				url,
				isMain: i === data.mainPhotoIndex,
			}));
			await listingsClient.create({ ...data, photos });
			// Submitted listing supersedes any server draft this wizard was tied to.
			if (draftIdRef.current) {
				await draftsClient.remove(draftIdRef.current).catch(() => null);
			}
			invalidateHasListings();
			toast.success("Listing submitted for review");
			reset();
			router.push("/listing/properties");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not submit listing — try again");
		} finally {
			setSubmitting(false);
		}
	};

	const renderStep = () => {
		switch (currentStepDef.key) {
			case "overview":
				return <ObjectiveStep />;
			case "kind":
				return <KindStep />;
			case "location":
				return <LocationStep />;
			case "property-info":
				return <PropertyInfoStep />;
			case "land-details":
				return <LandDetailsStep />;
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

	if (hydrating) {
		return (
			<div className="fixed inset-0 z-[80] flex items-center justify-center bg-bg-page">
				<div className="text-[14px] text-black/60">Loading your draft…</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-[80] flex flex-col bg-bg-page">
			{/* Top bar */}
			<header className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 bg-white px-4 md:px-8">
				<Link href="/listing/properties" className="flex items-center gap-2 text-[20px] font-semibold tracking-tight">
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
					<div className="mx-auto w-full max-w-[760px] px-4 py-6 md:px-8 md:py-10">
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
				editingExistingDraft={!!draftIdRef.current}
			/>
		</div>
	);
}
