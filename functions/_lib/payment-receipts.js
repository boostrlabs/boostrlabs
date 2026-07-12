import { syncPaymentReceipt, updateSmartDocument } from "./documents.js";

export async function syncInteractiveReceipt(env, paymentId, status = "paid") {
  let document = await syncPaymentReceipt(env, paymentId, status);
  if (!document?.id || !document.public_url) return document;
  const blocks = Array.isArray(document.blocks) ? document.blocks : [];
  let changed = false;
  const corrected = blocks.map((block) => {
    if (block?.type !== "qr" || block.value === document.public_url) return block;
    changed = true;
    return { ...block, value: document.public_url };
  });
  if (changed) {
    document = await updateSmartDocument(env, document.id, { blocks: corrected });
  }
  return document;
}
