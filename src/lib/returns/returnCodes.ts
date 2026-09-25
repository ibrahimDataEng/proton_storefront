/**
 * Return-flow codes and limits with NO runtime imports — safe for client
 * components (importing returnMetadata.ts would pull the generated @/gql/graphql
 * module, with every document string, into the browser bundle). Metadata stores
 * these codes, never translated labels.
 */

export const RETURN_STATUSES = [
	"requested",
	"rejected",
	"pickup_scheduled",
	"item_received",
	"refunded",
] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RETURN_REASONS = [
	"damaged",
	"expired",
	"wrong_item",
	"missing_items",
	"not_as_described",
	"other",
] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];

export const RETURN_DETAILS_MAX_LENGTH = 1000;
export const REJECTION_NOTE_MAX_LENGTH = 1000;
