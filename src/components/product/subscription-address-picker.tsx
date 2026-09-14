"use client";

import type { CustomerAddress } from "@/lib/vendure/shop-client";
import type { NewSubscriptionAddressInput } from "@/lib/vendure/subscriptions-client";

const NEW_ADDRESS_FIELDS = [
  ["fullName", "Nombre completo", "sm:col-span-2"],
  ["streetLine1", "Dirección", "sm:col-span-2"],
  ["city", "Ciudad", ""],
  ["province", "Departamento", ""],
  ["neighborhood", "Barrio", ""],
  ["phoneNumber", "Teléfono", ""]
] as const;

/** Shared between the "create a subscription" panel (product-subscription.tsx) and the "edit an
 *  existing subscription's address" flow (subscriptions-manager.tsx) — both need the exact same
 *  "pick a saved address or add a new one" UI. */
export function SubscriptionAddressPicker({
  addresses,
  addressId,
  useNewAddress,
  newAddress,
  onSelectExisting,
  onUseNewAddress,
  onChangeNewAddress
}: {
  addresses: CustomerAddress[];
  addressId: string;
  useNewAddress: boolean;
  newAddress: NewSubscriptionAddressInput;
  onSelectExisting: (id: string) => void;
  onUseNewAddress: () => void;
  onChangeNewAddress: (next: NewSubscriptionAddressInput) => void;
}) {
  return (
    <div className="space-y-2">
      {addresses.length > 0 ? (
        <div className="space-y-2">
          {addresses.map((address) => (
            <label
              className={`flex cursor-pointer items-start gap-2 rounded-2xl border px-3 py-2 text-sm ${
                !useNewAddress && addressId === address.id
                  ? "border-[var(--brand-violet)] bg-white"
                  : "border-[var(--line)] bg-white/60"
              }`}
              key={address.id}
            >
              <input
                checked={!useNewAddress && addressId === address.id}
                name="subscriptionAddress"
                onChange={() => onSelectExisting(address.id)}
                type="radio"
              />
              <span>
                {address.fullName} — {address.streetLine1}, {address.city}
              </span>
            </label>
          ))}
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${
              useNewAddress ? "border-[var(--brand-violet)] bg-white" : "border-[var(--line)] bg-white/60"
            }`}
          >
            <input checked={useNewAddress} name="subscriptionAddress" onChange={onUseNewAddress} type="radio" />
            <span className="font-bold">+ Nueva dirección</span>
          </label>
        </div>
      ) : null}

      {useNewAddress ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {NEW_ADDRESS_FIELDS.map(([field, label, span]) => (
            <input
              className={`h-11 rounded-xl border border-[var(--line)] px-3 text-sm ${span}`}
              key={field}
              onChange={(event) => onChangeNewAddress({ ...newAddress, [field]: event.target.value })}
              placeholder={label}
              type="text"
              value={newAddress[field] ?? ""}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
