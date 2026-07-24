export type PredictionSelection = {
  messageIndex: number;
  symbolIndex: number;
  luckyNumber: number;
  dateKey: string;
};

export const PREDICTION_MESSAGE_COUNT = 10;
export const PREDICTION_SYMBOL_COUNT = 5;
export const PREDICTION_COMBINATION_COUNT = PREDICTION_MESSAGE_COUNT * PREDICTION_SYMBOL_COUNT;

export function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function selectionFromWords(words: Uint32Array, dateKey: string): PredictionSelection {
  return {
    messageIndex: words[0] % PREDICTION_MESSAGE_COUNT,
    symbolIndex: words[1] % PREDICTION_SYMBOL_COUNT,
    luckyNumber: (words[2] % 99) + 1,
    dateKey,
  };
}

export function createRandomPrediction(
  date = new Date(),
  random: (array: Uint32Array) => Uint32Array = crypto.getRandomValues.bind(crypto),
): PredictionSelection {
  const words = new Uint32Array(3);
  random(words);
  return selectionFromWords(words, utcDateKey(date));
}

export async function createDailyPrediction(
  walletAddress: string,
  date = new Date(),
  digest: (data: BufferSource) => Promise<ArrayBuffer> = (data) => crypto.subtle.digest("SHA-256", data),
): Promise<PredictionSelection> {
  const dateKey = utcDateKey(date);
  const normalizedAddress = walletAddress.trim().toLowerCase();
  const bytes = new TextEncoder().encode(`${normalizedAddress}:${dateKey}`);
  const hash = await digest(bytes);
  const view = new DataView(hash);
  const words = new Uint32Array([
    view.getUint32(0, false),
    view.getUint32(4, false),
    view.getUint32(8, false),
  ]);
  return selectionFromWords(words, dateKey);
}
