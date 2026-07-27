// Server-only. Thin wrapper around the Mistral chat-completions API. Reads
// LLM_API_KEY/LLM_MODEL directly from process.env — never imported from a
// Client Component, never re-exported to the browser.

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 30_000;

export interface MistralMessage {
  role: "system" | "user";
  content: string;
}

export interface CallMistralOptions {
  messages: MistralMessage[];
  signal?: AbortSignal;
}

export type MistralAdapterErrorReason = "timeout" | "rate_limit" | "network" | "http";

export class MistralAdapterError extends Error {
  constructor(
    message: string,
    public readonly reason: MistralAdapterErrorReason,
  ) {
    super(message);
    this.name = "MistralAdapterError";
  }
}

// Calls the Mistral chat-completions endpoint and returns the raw text
// content of the response. Each attempt is capped at 30 seconds independent
// of the caller's own signal; a caller-initiated abort propagates as-is so
// the caller can tell cancellation apart from a provider failure.
export async function callMistral({ messages, signal }: CallMistralOptions): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  let response: Response;
  try {
    response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: "json_object" },
      }),
      signal: combinedSignal,
    });
  } catch (error) {
    if (timeoutSignal.aborted) {
      throw new MistralAdapterError("Mistral request timed out", "timeout");
    }
    if (signal?.aborted) {
      throw error;
    }
    throw new MistralAdapterError("Mistral request failed", "network");
  }

  if (response.status === 429) {
    throw new MistralAdapterError("Mistral rate limit exceeded", "rate_limit");
  }

  if (!response.ok) {
    throw new MistralAdapterError(`Mistral request failed with status ${response.status}`, "http");
  }

  const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new MistralAdapterError("Mistral response missing content", "http");
  }

  return content;
}
