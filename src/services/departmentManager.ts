/**
 * HoloLab XR — Department Workspace Manager
 * Coordinates the Chemistry, Biology, and Physics workspaces in the student's personal laboratory.
 */

import type { Department } from '../types/platform';
import { apiClient } from './apiClient';

export interface DepartmentConfig {
  id: Department;
  title: string;
  code: string;
  accentColor: string;
  description: string;
}

export const DEPARTMENTS: Record<Department, DepartmentConfig> = {
  chemistry: {
    id: 'chemistry',
    title: 'Chemistry Laboratory',
    code: 'CHEM-304',
    accentColor: '#0284c7', // Sky blue
    description: 'Analytical chemistry, acid-base neutralisation, gas evolution, and stoichiometry.',
  },
  biology: {
    id: 'biology',
    title: 'Biology & Life Sciences Laboratory',
    code: 'BIO-201',
    accentColor: '#16a34a', // Emerald green
    description: 'Cellular microscopy, tissue staining, enzyme kinetics, and photosynthesis respiration.',
  },
  physics: {
    id: 'physics',
    title: 'Physics & Mechanics Laboratory',
    code: 'PHYS-101',
    accentColor: '#8b5cf6', // Violet
    description: 'Optics, pendulum mechanics, electric circuits, and thermodynamics.',
  },
};

export class DepartmentManager {
  private currentDept: Department = 'chemistry';
  private listeners = new Set<(dept: Department) => void>();

  constructor() {
    this.currentDept = apiClient.session.activeDepartment || 'chemistry';
  }

  get current(): DepartmentConfig {
    return DEPARTMENTS[this.currentDept];
  }

  get activeDepartment(): Department {
    return this.currentDept;
  }

  switchDepartment(dept: Department) {
    if (this.currentDept === dept) return;
    this.currentDept = dept;
    apiClient.setDepartment(dept);
    this.listeners.forEach((fn) => fn(dept));
  }

  onDepartmentChange(fn: (dept: Department) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const departmentManager = new DepartmentManager();
