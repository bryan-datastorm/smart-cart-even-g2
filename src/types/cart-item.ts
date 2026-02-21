/**
 * Represents a single item in the Smart Cart grocery list.
 * Used both in the React UI state and serialized to the glasses' local storage.
 */
export interface CartItemData {
  /** Unique numeric identifier created with Date.now() at insertion time. */
  id: number;
  /** Display name of the grocery item. */
  name: string;
  /** Whether the item has been marked as collected. */
  done: boolean;
}
