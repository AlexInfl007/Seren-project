import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/config/contract";

type AbiFunction = { type: string; name?: string; stateMutability?: string; inputs?: readonly unknown[] };

export function hasContractFunction(name: string, inputCount?: number) {
  return (CONTRACT_ABI as readonly AbiFunction[]).some(
    (item) => item.type === "function" && item.name === name && (inputCount === undefined || item.inputs?.length === inputCount),
  );
}

export function validatePurchaseMethod() {
  const fragment = (CONTRACT_ABI as readonly AbiFunction[]).find((item) => item.type === "function" && item.name === "buyTickets");
  if (!fragment) return { ok: false as const, reason: "missing_method" as const };
  if (fragment.stateMutability !== "payable") return { ok: false as const, reason: "not_payable" as const };
  if (fragment.inputs?.length !== 5) return { ok: false as const, reason: "wrong_signature" as const };
  return { ok: true as const, method: "buyTickets" as const };
}

export function getContractAdapter() {
  return { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, purchaseMethod: "buyTickets" as const, purchaseValidation: validatePurchaseMethod() };
}
