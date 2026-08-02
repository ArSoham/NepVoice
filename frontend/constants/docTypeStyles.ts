// Maps the backend's doc_type classification to a color + label emoji name
// for the history/result thumbnails. Keep in sync with the labels the
// backend's classify_document() can return (see gemini_client.py).
export const docTypeStyles: Record<string, { color: string; emoji: string; label: string }> = {
  medicine_label: { color: '#3B7DD8', emoji: 'pill', label: 'Medicine Labels' },
  government_notice: { color: '#E8A33D', emoji: 'notice', label: 'Government Notices' },
  bus_ticket: { color: '#2E7D6B', emoji: 'ticket', label: 'Bus Tickets' },
  receipt: { color: '#E8A33D', emoji: 'receipt', label: 'Receipts' },
  agricultural_instructions: { color: '#2E7D6B', emoji: 'leaf', label: 'Farming Instructions' },
  handwritten_note: { color: '#D8453B', emoji: 'note', label: 'Handwritten Notes' },
  other: { color: '#3B7DD8', emoji: 'document', label: 'Other Documents' },
};

export function styleForDocType(docType: string) {
  return docTypeStyles[docType] ?? docTypeStyles.other;
}
