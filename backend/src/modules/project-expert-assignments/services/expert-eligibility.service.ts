import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { toObjectId } from '../../../common/utils/mongo-query';
import { ProjectForReviewAssignment } from '../../projects/services/projects.service';
import { ProjectsService } from '../../projects/services/projects.service';
import { User } from '../../users/schemas/user.schema';
import { UserRole } from '../../users/types/user-role.type';
import { UserStatus } from '../../users/types/user-status.type';

export type ExpertEligibilityReason =
  | 'expert_not_found'
  | 'expert_inactive'
  | 'expert_role_missing'
  | 'project_not_found'
  | 'project_inactive'
  | 'project_discipline_missing'
  | 'expert_discipline_missing'
  | 'discipline_mismatch'
  | 'lead_organization_conflict'
  | 'cooperation_organization_conflict'
  | 'duplicate_expert'
  | 'invalid_object_id';

export type ExpertEligibilityResult = {
  allowed: boolean;
  reasons: ExpertEligibilityReason[];
  detail: {
    projectId: string;
    expertUserId: string;
    matchedDisciplineIds: string[];
    leadOrganizationConflict: boolean;
    cooperationOrganizationConflictIds: string[];
  };
};

type ExpertUserLean = {
  _id: Types.ObjectId;
  roles: UserRole[];
  organizationIds?: Types.ObjectId[];
  disciplineIds?: Types.ObjectId[];
  isActive?: boolean;
  status: UserStatus;
};

@Injectable()
export class ExpertEligibilityService {
  constructor(
    private readonly projectsService: ProjectsService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async checkExpertForProject(
    projectId: string,
    expertUserId: string,
    projectInput?: ProjectForReviewAssignment,
  ): Promise<ExpertEligibilityResult> {
    const reasons: ExpertEligibilityReason[] = [];

    if (
      !Types.ObjectId.isValid(projectId) ||
      !Types.ObjectId.isValid(expertUserId)
    ) {
      return this.toResult({
        projectId,
        expertUserId,
        reasons: ['invalid_object_id'],
        matchedDisciplineIds: [],
        leadOrganizationConflict: false,
        cooperationOrganizationConflictIds: [],
      });
    }

    const project = projectInput ?? (await this.findProject(projectId));

    if (!project) {
      return this.toResult({
        projectId,
        expertUserId,
        reasons: ['project_not_found'],
        matchedDisciplineIds: [],
        leadOrganizationConflict: false,
        cooperationOrganizationConflictIds: [],
      });
    }

    if (!project.isActive) {
      reasons.push('project_inactive');
    }

    const projectDisciplineIds = project.disciplineIds.map((id) =>
      id.toString(),
    );

    if (projectDisciplineIds.length === 0) {
      reasons.push('project_discipline_missing');
    }

    const expert = await this.userModel
      .findById(toObjectId(expertUserId, 'expertUserId'))
      .select({
        roles: 1,
        organizationIds: 1,
        disciplineIds: 1,
        isActive: 1,
        status: 1,
      })
      .lean<ExpertUserLean | null>()
      .exec();

    if (!expert) {
      reasons.push('expert_not_found');
      return this.toResult({
        projectId,
        expertUserId,
        reasons,
        matchedDisciplineIds: [],
        leadOrganizationConflict: false,
        cooperationOrganizationConflictIds: [],
      });
    }

    if (expert.isActive === false || expert.status !== 'active') {
      reasons.push('expert_inactive');
    }

    if (!expert.roles.includes('expert')) {
      reasons.push('expert_role_missing');
    }

    const expertDisciplineIds = (expert.disciplineIds ?? []).map((id) =>
      id.toString(),
    );

    if (expertDisciplineIds.length === 0) {
      reasons.push('expert_discipline_missing');
    }

    const matchedDisciplineIds = expertDisciplineIds.filter((id) =>
      projectDisciplineIds.includes(id),
    );

    if (
      projectDisciplineIds.length > 0 &&
      expertDisciplineIds.length > 0 &&
      matchedDisciplineIds.length === 0
    ) {
      reasons.push('discipline_mismatch');
    }

    const expertOrganizationIds = (expert.organizationIds ?? []).map((id) =>
      id.toString(),
    );
    const leadOrganizationId = project.leadOrganizationId?.toString() ?? null;
    const leadOrganizationConflict =
      leadOrganizationId !== null &&
      expertOrganizationIds.includes(leadOrganizationId);

    if (leadOrganizationConflict) {
      reasons.push('lead_organization_conflict');
    }

    const cooperationOrganizationIds = project.cooperationOrganizationIds.map(
      (id) => id.toString(),
    );
    const cooperationOrganizationConflictIds = expertOrganizationIds.filter(
      (id) => cooperationOrganizationIds.includes(id),
    );

    if (cooperationOrganizationConflictIds.length > 0) {
      reasons.push('cooperation_organization_conflict');
    }

    return this.toResult({
      projectId,
      expertUserId,
      reasons,
      matchedDisciplineIds,
      leadOrganizationConflict,
      cooperationOrganizationConflictIds,
    });
  }

  private async findProject(
    projectId: string,
  ): Promise<ProjectForReviewAssignment | null> {
    try {
      return await this.projectsService.findForReviewAssignment(projectId);
    } catch {
      return null;
    }
  }

  private toResult(input: {
    projectId: string;
    expertUserId: string;
    reasons: ExpertEligibilityReason[];
    matchedDisciplineIds: string[];
    leadOrganizationConflict: boolean;
    cooperationOrganizationConflictIds: string[];
  }): ExpertEligibilityResult {
    return {
      allowed: input.reasons.length === 0,
      reasons: input.reasons,
      detail: {
        projectId: input.projectId,
        expertUserId: input.expertUserId,
        matchedDisciplineIds: input.matchedDisciplineIds,
        leadOrganizationConflict: input.leadOrganizationConflict,
        cooperationOrganizationConflictIds:
          input.cooperationOrganizationConflictIds,
      },
    };
  }
}
