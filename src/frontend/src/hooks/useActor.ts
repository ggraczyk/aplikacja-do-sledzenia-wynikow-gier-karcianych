import { type Backend, createActor } from "@/backend";
import { useActor as useActorBase } from "@caffeineai/core-infrastructure";

/**
 * Thin wrapper re-exporting useActor from @caffeineai/core-infrastructure
 * with the bound createActor from @/backend. Keeps call sites decoupled
 * from the actor factory import.
 *
 * Note: @caffeineai/core-infrastructure does NOT export an `Actor` symbol,
 * so we type the returned actor as `Backend | null` directly from @/backend.
 */
export function useActor() {
  return useActorBase<Backend>(createActor);
}
