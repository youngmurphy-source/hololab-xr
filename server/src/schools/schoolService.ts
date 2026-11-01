import type { School, SchoolStatus, StudentProfile, StudentLab, LabSpace } from '../../../src/types/platform';

export class SchoolService {
  private schools = new Map<string, School>();

  async registerSchool(input: {
    name: string;
    slug: string;
    email: string;
    countryCode: string;
  }): Promise<School> {
    const slug = input.slug.toLowerCase().trim();
    const existing = Array.from(this.schools.values()).find((s) => s.slug === slug);
    if (existing) {
      throw new Error(`School with slug '${slug}' is already registered`);
    }

    const school: School = {
      id: 'sch_' + Math.random().toString(36).substring(2, 11),
      name: input.name,
      slug,
      email: input.email.toLowerCase(),
      countryCode: input.countryCode.toUpperCase(),
      status: 'pending', // Requires institutional verification before student enrolments
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.schools.set(school.id, school);
    return school;
  }

  async verifyAndApproveSchool(schoolId: string): Promise<School> {
    const school = this.schools.get(schoolId);
    if (!school) throw new Error('School not found');
    school.status = 'active';
    school.updatedAt = new Date().toISOString();
    return school;
  }

  async getSchool(schoolId: string): Promise<School> {
    const school = this.schools.get(schoolId);
    if (!school) throw new Error('School not found');
    return school;
  }
}

export class StudentService {
  private profiles = new Map<string, StudentProfile>();
  private labs = new Map<string, StudentLab>();
  private spaces = new Map<string, LabSpace[]>();

  async enrolStudent(input: {
    userId: string;
    schoolId: string;
    admissionNumber: string;
    dateOfBirth?: string;
  }): Promise<{ profile: StudentProfile; lab: StudentLab; spaces: LabSpace[] }> {
    const existing = Array.from(this.profiles.values()).find(
      (p) => p.schoolId === input.schoolId && p.admissionNumber === input.admissionNumber
    );
    if (existing) {
      throw new Error(`Student admission number '${input.admissionNumber}' already exists in this school`);
    }

    const profile: StudentProfile = {
      userId: input.userId,
      schoolId: input.schoolId,
      admissionNumber: input.admissionNumber,
      dateOfBirth: input.dateOfBirth,
      createdAt: new Date().toISOString(),
    };
    this.profiles.set(input.userId, profile);

    // Provision private persistent laboratory root (One student = Exactly one private laboratory)
    const lab: StudentLab = {
      id: 'lab_' + Math.random().toString(36).substring(2, 11),
      studentId: input.userId,
      schoolId: input.schoolId,
      name: `Private Science Lab [${input.admissionNumber}]`,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.labs.set(lab.id, lab);

    // Provision three departmental spaces inside the student's laboratory
    const departments = ['chemistry', 'biology', 'physics'] as const;
    const labSpaces: LabSpace[] = departments.map((dept) => ({
      id: `spc_${dept}_` + Math.random().toString(36).substring(2, 9),
      labId: lab.id,
      department: dept,
      sceneConfig: {
        lighting: 'studio_neutral',
        tableHeight: 0.9,
        safetyEquipmentChecked: true,
      },
      createdAt: new Date().toISOString(),
    }));
    this.spaces.set(lab.id, labSpaces);

    return { profile, lab, spaces: labSpaces };
  }

  getStudentLab(studentId: string): { lab: StudentLab; spaces: LabSpace[] } {
    const lab = Array.from(this.labs.values()).find((l) => l.studentId === studentId);
    if (!lab) throw new Error('Student does not possess an active personal laboratory');
    const spaces = this.spaces.get(lab.id) || [];
    return { lab, spaces };
  }
}
