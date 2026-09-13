"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useAuthModalStore } from "@/stores/authModalStore";
import { favouritesClient } from "@/lib/clients/favourites";
import { savedSearchesClient } from "@/lib/clients/savedSearches";
import { contactsClient } from "@/lib/clients/contacts";
import { getWhatsAppLink } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { broadcastAuthChange } from "@/lib/auth-sync";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { VerifyForm } from "./VerifyForm";

export function AuthModal() {
  const router = useRouter();
  const open = useAuthModalStore((s) => s.open);
  const mode = useAuthModalStore((s) => s.mode);
  const verifyCtx = useAuthModalStore((s) => s.verifyCtx);
  const switchTo = useAuthModalStore((s) => s.switchTo);
  const goToVerify = useAuthModalStore((s) => s.goToVerify);
  const close = useAuthModalStore((s) => s.close);
  const consumeIntent = useAuthModalStore((s) => s.consumeIntent);

  // Lock body scroll while open + close on Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!open) return null;

  async function handleAuthSuccess() {
    const intent = consumeIntent();
    const wasSignup = verifyCtx?.mode === "SIGNUP";
    close();

    // Tell other tabs about the new session so their useSession refetches.
    broadcastAuthChange({ type: "signed-in" });

    // Replay the captured intent against the new session
    if (intent?.type === "favourite") {
      try {
        await favouritesClient.add(intent.propertyId);
        toast.success("Saved to favourites");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not save favourite — try again");
      }
    } else if (intent?.type === "save_search") {
      try {
        await savedSearchesClient.create({
          name: intent.name,
          criteria: intent.criteria,
          notifyInstant: true,
        });
        toast.success(`Search saved: ${intent.name}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not save search — try again");
      }
    } else if (intent?.type === "contact") {
      try {
        // Default replay channel after auth is WhatsApp (most popular in NG).
        // The user can pick a specific channel by tapping again on the page.
        const res = await contactsClient.create({
          propertyId: intent.propertyId,
          contactMethod: "WHATSAPP",
          source: "auth-replay",
        });
        if (res.contactTarget.whatsapp) {
          window.open(getWhatsAppLink(res.contactTarget.whatsapp), "_blank");
        }
        toast.success("Opening WhatsApp…");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Could not reach the lister — try again"
        );
      }
    } else if (wasSignup) {
      toast.success("Welcome to UNO!");
    } else {
      toast.success("Signed in");
    }

    // Fresh signups land on /feed (their new home) when there's nothing to do here.
    // Otherwise refresh in place so the new session reflects everywhere.
    if (wasSignup && !intent) {
      router.push("/feed");
    } else {
      router.refresh();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 py-10 sm:items-center sm:py-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-[440px] rounded-[20px] bg-white p-6 shadow-2xl md:p-8 sm:max-h-[92vh] sm:overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-[rgba(10,10,10,0.6)] transition-colors hover:bg-[#faf9f9] hover:text-[#161515]"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {mode === "login" && (
          <LoginForm
            onCodeSent={({ email, devCode }) =>
              goToVerify({ email, mode: "LOGIN", devCode })
            }
            onSwitchToSignup={() => switchTo("signup")}
          />
        )}

        {mode === "signup" && (
          <SignupForm
            onCodeSent={({ email, name, phone, devCode }) =>
              goToVerify({ email, mode: "SIGNUP", name, phone, devCode })
            }
            onSwitchToLogin={() => switchTo("login")}
          />
        )}

        {mode === "verify" && verifyCtx && (
          <VerifyForm
            email={verifyCtx.email}
            mode={verifyCtx.mode}
            name={verifyCtx.name}
            phone={verifyCtx.phone}
            initialDevCode={verifyCtx.devCode}
            onSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </div>
  );
}
