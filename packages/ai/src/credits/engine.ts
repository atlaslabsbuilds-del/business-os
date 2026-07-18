export type CreditDeductionInput = {
  totalTokens: number;
  model: string;
  provider: string;
  conversationId?: string;
};

export type CreditEngine = {
  tokensToCredits: (totalTokens: number) => number;
  buildMetadata: (input: CreditDeductionInput) => Record<string, unknown>;
};

export function createCreditEngine(): CreditEngine {
  return {
    tokensToCredits(totalTokens) {
      if (totalTokens <= 0) {
        return 1;
      }
      return Math.max(1, Math.ceil(totalTokens / 100));
    },

    buildMetadata(input) {
      return {
        model: input.model,
        provider: input.provider,
        totalTokens: input.totalTokens,
        conversationId: input.conversationId,
      };
    },
  };
}

export const creditEngine = createCreditEngine();
