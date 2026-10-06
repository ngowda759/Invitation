"use client";

import { useState } from "react";

import { ContentSection } from "@/components/experience/ContentSection";
import { Button, ButtonLink } from "@/components/ui/button";
import { share as defaultContent, type ShareContent } from "@/content/share";
import { cn } from "@/lib/utils";

/**
 * Share.
 *
 * A small client island for progressive enhancement only. The primary control opens
 * the platform share sheet when the browser offers one and falls back to copying the
 * link; the WhatsApp target is a plain link. The section therefore still presents a
 * working share route with client JavaScript disabled.
 */
export function ShareExperience({
  content = defaultContent,
}: {
  content?: ShareContent;
}) {
  const [copied, setCopied] = useState(false);

  const shareMessage = content.message.trim();
  const message = shareMessage ? `${shareMessage} ` : "";
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  async function handleShare() {
    if (typeof navigator === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareMessage || "Invitation",
          text: shareMessage,
          url,
        });
        return;
      } catch {
        // The visitor dismissed the share sheet; fall through to copying the link.
      }
    }
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard permission denied; the WhatsApp link remains available.
    }
  }

  return (
    <ContentSection id="share" heading="Share" intro={content.intro}>
      <p className="mt-6 text-base leading-relaxed text-text-dark/80">
        Invite family and friends to the invitation.
      </p>
      <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button type="button" size="lg" onClick={handleShare}>
          Share this invitation
        </Button>
        <ButtonLink
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          size="lg"
        >
          Share on WhatsApp
          <span className="sr-only"> (opens in a new tab)</span>
        </ButtonLink>
      </div>
      {/*
        The button label stays stable so its accessible name does not change under the
        visitor's focus. The outcome is announced through a polite status region, which
        screen readers pick up without stealing focus.
      */}
      <p
        role="status"
        className={cn("mt-4 text-sm text-text-dark/70", !copied && "sr-only")}
      >
        {copied ? "A link to this invitation was copied to your clipboard." : ""}
      </p>
    </ContentSection>
  );
}
