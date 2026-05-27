"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useAuthModalStore } from "@/stores/authModalStore";
import { contactsClient } from "@/lib/clients/contacts";
import { toast } from "@/stores/toastStore";
import { getWhatsAppLink } from "@/lib/utils";

export type ContactChannel = "WHATSAPP" | "PHONE" | "EMAIL";

type ContactArgs = {
	propertyId: string;
	method: ContactChannel;
	source?: string;
	whatsappMessage?: string;
	emailSubject?: string;
	emailBody?: string;
};

/**
 * Drives Call / WhatsApp / Email actions on the property detail page.
 *
 * Guests get the auth modal (intent: "contact") and the action replays after
 * a successful sign-in via AuthModal.handleAuthSuccess. Signed-in users POST
 * /api/contacts (logs the lead + returns the channel target) then we open the
 * appropriate deep link.
 */
export function useContact() {
	const { status } = useSession();
	const openLogin = useAuthModalStore((s) => s.openLogin);
	const [pending, setPending] = useState<ContactChannel | null>(null);

	const contact = useCallback(
		async (args: ContactArgs) => {
			if (status !== "authenticated") {
				openLogin({ type: "contact", propertyId: args.propertyId });
				return;
			}
			setPending(args.method);
			try {
				const res = await contactsClient.create({
					propertyId: args.propertyId,
					contactMethod: args.method,
					source: args.source,
				});
				openChannel(args, res.contactTarget);
			} catch (e) {
				toast.error(
					e instanceof Error ? e.message : "Could not reach the lister — try again"
				);
			} finally {
				setPending(null);
			}
		},
		[status, openLogin]
	);

	return { contact, pending };
}

function openChannel(
	args: ContactArgs,
	target: { phone?: string; whatsapp?: string; email?: string }
) {
	if (typeof window === "undefined") return;
	if (args.method === "WHATSAPP" && target.whatsapp) {
		window.open(getWhatsAppLink(target.whatsapp, args.whatsappMessage), "_blank");
		return;
	}
	if (args.method === "PHONE" && target.phone) {
		window.location.href = `tel:${target.phone.replace(/\s+/g, "")}`;
		return;
	}
	if (args.method === "EMAIL" && target.email) {
		const params = new URLSearchParams();
		if (args.emailSubject) params.set("subject", args.emailSubject);
		if (args.emailBody) params.set("body", args.emailBody);
		const q = params.toString();
		window.location.href = `mailto:${target.email}${q ? `?${q}` : ""}`;
	}
}
