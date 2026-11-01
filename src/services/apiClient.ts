/**
 * HoloLab XR — Client API Gateway & Persistence Service
 * Coordinates with the HoloLab School Platform Backend
 */

import type { Department, StudentInventoryItem, ExperimentAttempt } from '../types/platform';

export interface LocalSessionState {
  token: string | null;
  studentId: string | null;
  schoolId: string | null;
  labId: string | null;
  activeDepartment: Department;
}

class ApiClient {
  private state: LocalSessionState = {
    token: null,
    studentId: null,
    schoolId: null,
    labId: null,
    activeDepartment: 'chemistry',
  };

  private baseUrl = '/api/v1';

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const saved = localStorage.getItem('hlxr.session');
      if (saved) {
        this.state = JSON.parse(saved);
      }
    } catch {
      /* storage inaccessible */
    }
  }

  saveSession(session: Partial<LocalSessionState>) {
    this.state = { ...this.state, ...session };
    try {
      localStorage.setItem('hlxr.session', JSON.stringify(this.state));
    } catch {
      /* storage inaccessible */
    }
  }

  get session(): Readonly<LocalSessionState> {
    return this.state;
  }

  setDepartment(dept: Department) {
    this.state.activeDepartment = dept;
    this.saveSession({ activeDepartment: dept });
  }

  /**
   * Save session state snapshot (bench height, equipment layout, active experiment)
   */
  async saveLabSnapshot(snapshot: Record<string, unknown>): Promise<boolean> {
    if (!this.state.token || !this.state.labId) {
      // Local development or guest mode fallback
      try {
        localStorage.setItem(`hlxr.lab_snapshot.${this.state.activeDepartment}`, JSON.stringify(snapshot));
      } catch {
        /* storage blocked */
      }
      return true;
    }

    try {
      const res = await fetch(`${this.baseUrl}/labs/me/sessions/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.state.token}`,
        },
        body: JSON.stringify({
          department: this.state.activeDepartment,
          snapshot,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetch student's verified virtual inventory
   */
  async fetchInventory(): Promise<StudentInventoryItem[]> {
    if (!this.state.token) {
      // Fallback default starter inventory for offline/preview
      return [
        {
          id: 'inv_default_beaker',
          studentId: 'guest',
          productId: 'prod_1',
          productName: 'Pyrex Borosilicate Beaker (250 mL)',
          productType: 'reusable_equipment',
          department: 'chemistry',
          quantity: 4,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'inv_default_hcl',
          studentId: 'guest',
          productId: 'prod_3',
          productName: 'Hydrochloric Acid Solution (0.1 M, 250 mL)',
          productType: 'consumable_reagent',
          department: 'chemistry',
          quantity: 250,
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    try {
      const res = await fetch(`${this.baseUrl}/store/inventory`, {
        headers: { Authorization: `Bearer ${this.state.token}` },
      });
      if (!res.ok) throw new Error('Failed to load inventory');
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Record scientific observation during reaction
   */
  async recordObservation(attemptId: string, type: string, data: Record<string, unknown>) {
    if (!this.state.token) return;
    try {
      await fetch(`${this.baseUrl}/experiments/attempts/${attemptId}/observations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.state.token}`,
        },
        body: JSON.stringify({ observationType: type, observation: data }),
      });
    } catch {
      /* offline buffer */
    }
  }

  /**
   * Complete experiment attempt & generate practical report
   */
  async completeAttempt(attemptId: string, summary: Record<string, unknown>): Promise<ExperimentAttempt | null> {
    if (!this.state.token) return null;
    try {
      const res = await fetch(`${this.baseUrl}/experiments/attempts/${attemptId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.state.token}`,
        },
        body: JSON.stringify(summary),
      });
      if (res.ok) return await res.json();
    } catch {
      /* ignore */
    }
    return null;
  }
}

export const apiClient = new ApiClient();
