// Maps the backend's doc_type classification to a color + label emoji name
// for the history/result thumbnails. Keep in sync with the labels the
// backend's classify_document() can return (see gemini_client.py).
export const docTypeStyles: Record<string, { color: string; emoji: string }> = {
  medicine_label: { color: '#3B7DD8', emoji: 'pill' },
  government_notice: { color: '#E8A33D', emoji: 'notice' },
  bus_ticket: { color: '#2E7D6B', emoji: 'ticket' },
  receipt: { color: '#E8A33D', emoji: 'receipt' },
  agricultural_instructions: { color: '#2E7D6B', emoji: 'leaf' },
  handwritten_note: { color: '#D8453B', emoji: 'note' },
  other: { color: '#3B7DD8', emoji: 'document' },
};

export function styleForDocType(docType: string) {
  return docTypeStyles[docType] ?? docTypeStyles.other;
}
