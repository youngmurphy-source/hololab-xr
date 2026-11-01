/**
 * HoloLab XR — Inventory & Observation Adapter
 * Bridges local Three.js physics and pouring simulations with server-validated inventory
 */

import { apiClient } from './apiClient';
import type { StudentInventoryItem } from '../types/platform';

export interface InventoryPort {
  has(productId: string, quantity?: number): boolean;
  consume(productId: string, quantity: number): void;
}

export interface ObservationPort {
  record(type: string, data: Record<string, unknown>): void;
}

export class InventoryAdapter implements InventoryPort, ObservationPort {
  private localInventory = new Map<string, StudentInventoryItem>();
  private activeAttemptId: string | null = null;

  async init(attemptId?: string) {
    this.activeAttemptId = attemptId || null;
    const items = await apiClient.fetchInventory();
    this.localInventory.clear();
    items.forEach((item) => this.localInventory.set(item.productId, item));
  }

  has(productId: string, quantity = 1): boolean {
    const item = this.localInventory.get(productId);
    if (!item) return false;
    return item.quantity >= quantity;
  }

  consume(productId: string, quantity: number): void {
    const item = this.localInventory.get(productId);
    if (!item) return;
    if (item.productType === 'consumable_reagent') {
      item.quantity = Math.max(0, item.quantity - quantity);
    }
  }

  record(type: string, data: Record<string, unknown>): void {
    if (this.activeAttemptId) {
      apiClient.recordObservation(this.activeAttemptId, type, data);
    }
  }
}

export const inventoryAdapter = new InventoryAdapter();
