import { event } from "@/content/event";

/**
 * Share content.
 *
 * The share affordances are generic: they describe the invitation itself, not a temple
 * fact. The message reuses the approved event name and a neutral call to open the
 * invitation; no date, timing or religious claim is invented here.
 */
export type ShareContent = {
  /** Optional introductory line for the section. */
  intro: string;
  /** Short message prefilled when sharing through WhatsApp or the native share sheet. */
  message: string;
};

export const share: ShareContent = {
  intro: "",
  message: `You are invited — ${event.name}. Open the digital invitation:`,
};
