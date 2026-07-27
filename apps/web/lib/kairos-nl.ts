/**
 * Natural-language navigation — re-exports Kairos Actions engine.
 * @deprecated Prefer importing from `./kairos-actions`.
 */
export {
  KAIROS_NAV_TARGETS,
  matchNaturalLanguageNav,
  normalizeCommandQuery,
  resolveAskKairosPrompt,
  resolveNaturalLanguageNav,
  type KairosNavTarget,
} from "./kairos-actions";
