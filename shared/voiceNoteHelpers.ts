export function buildVoiceFailureState(stage: string, error: any, draft: { text: string; audioPreview: any }) {
  return {
    failed: true,
    stage,
    error: error?.message || String(error || "Processing failed"),
    text: draft.text || "",
    audioPreview: draft.audioPreview || null,
  };
}

export function canSubmitVoiceDraft(value: string, isBusy: boolean) {
  if (isBusy) return false;
  return Boolean((value || "").trim());
}
