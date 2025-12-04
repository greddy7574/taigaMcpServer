/**
 * Sprint (Milestone) related MCP tools
 */

import { z } from 'zod';
import { TaigaService } from '../taigaService.js';
import { RESPONSE_TEMPLATES, SUCCESS_MESSAGES } from '../constants.js';
import { 
  resolveProjectId,
  formatSprintList,
  formatDate,
  formatSprintIssues,
  getStatusLabel,
  getSafeValue,
  calculateCompletionPercentage,
  createErrorResponse,
  createSuccessResponse
} from '../utils.js';

const taigaService = new TaigaService();

/**
 * Tool to list sprints in a project
 */
export const listSprintsTool = {
  name: 'listMilestones',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
  },
  handler: async ({ projectIdentifier }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);
      const milestones = await taigaService.listMilestones(projectId);

      if (milestones.length === 0) {
        return createErrorResponse(RESPONSE_TEMPLATES.NO_SPRINTS);
      }

      const sprintsList = `Sprints in Project:\n\n${formatSprintList(milestones)}`;
      return createSuccessResponse(sprintsList);
    } catch (error) {
      return createErrorResponse(`Failed to list sprints: ${error.message}`);
    }
  }
};

/**
 * Tool to get a single sprint's complete details
 */
export const getMilestoneTool = {
  name: 'getMilestone',
  schema: {
    milestoneId: z.string().describe('Milestone (Sprint) ID'),
  },
  handler: async ({ milestoneId }) => {
    try {
      const milestone = await taigaService.getMilestone(milestoneId);

      const startDate = formatDate(milestone.estimated_start);
      const endDate = formatDate(milestone.estimated_finish);
      const status = getStatusLabel(milestone.closed);

      // Format user stories list
      const userStoriesInfo = milestone.user_stories?.length > 0
        ? milestone.user_stories.map(story => `  • [#${story.ref}] ${story.subject} (${story.status_extra_info?.name || 'No status'})`).join('\n')
        : '  No user stories assigned';

      // Format watchers list
      const watchersInfo = milestone.watchers?.length > 0
        ? milestone.watchers.join(', ')
        : 'None';

      const milestoneDetails = `Sprint Details: ${milestone.name}

📋 Basic Information:
- ID: ${milestone.id}
- Slug: ${getSafeValue(milestone.slug, 'N/A')}
- Project: ${getSafeValue(milestone.project_extra_info?.name)}
- Project ID: ${milestone.project}
- Status: ${status}
- Order: ${getSafeValue(milestone.order, 'N/A')}

📅 Timeline:
- Start Date: ${startDate}
- End Date: ${endDate}
- Created: ${formatDate(milestone.created_date)}
- Modified: ${formatDate(milestone.modified_date)}

📊 Metrics:
- Total Points: ${getSafeValue(milestone.total_points, '0')}
- Closed Points: ${getSafeValue(milestone.closed_points, '0')}
- Total User Stories: ${milestone.user_stories?.length || 0}

👥 Team & Access:
- Owner: ${getSafeValue(milestone.owner_extra_info?.full_name_display, 'N/A')}
- Watchers: ${watchersInfo}
- Available Roles: ${milestone.available_roles?.join(', ') || 'None'}

📝 Description:
${getSafeValue(milestone.description, 'No description provided')}

📚 User Stories (${milestone.user_stories?.length || 0}):
${userStoriesInfo}

---
🔗 Permalink: ${milestone.permalink || 'N/A'}

📦 Complete Raw Data (JSON):
${JSON.stringify(milestone, null, 2)}`;

      return createSuccessResponse(milestoneDetails);
    } catch (error) {
      return createErrorResponse(`Failed to get sprint details: ${error.message}`);
    }
  }
};


/**
 * Tool to get sprint details and statistics
 */
export const getSprintStatsTool = {
  name: 'getMilestoneStats',
  schema: {
    milestoneId: z.string().describe('Milestone (Sprint) ID'),
  },
  handler: async ({ milestoneId }) => {
    try {
      // Get both milestone details and statistics
      const [milestone, stats] = await Promise.all([
        taigaService.getMilestone(milestoneId),
        taigaService.getMilestoneStats(milestoneId)
      ]);

      const startDate = formatDate(milestone.estimated_start);
      const endDate = formatDate(milestone.estimated_finish);
      const status = getStatusLabel(milestone.closed);
      const completionRate = calculateCompletionPercentage(stats.completed_userstories || 0, stats.total_userstories || 0);

      const milestoneDetails = `Sprint Details: ${milestone.name}

📊 Basic Information:
- Status: ${status}
- Start Date: ${startDate}
- End Date: ${endDate}
- Project: ${getSafeValue(milestone.project_extra_info?.name)}

📈 Progress Statistics:
- User Stories: ${stats.completed_userstories || 0}/${stats.total_userstories || 0} completed
- Tasks: ${stats.completed_tasks || 0}/${stats.total_tasks || 0} completed
- Points: ${stats.completed_points || 0}/${stats.total_points || 0} completed
- Hours: ${stats.completed_hours || 0}/${stats.total_hours || 0} completed

📋 User Stories Progress:
${stats.completed_userstories || 0 > 0 ? `✅ Completed: ${stats.completed_userstories}` : '⚪ No completed stories'}
${(stats.total_userstories || 0) - (stats.completed_userstories || 0) > 0 ? `🔄 Remaining: ${(stats.total_userstories || 0) - (stats.completed_userstories || 0)}` : ''}

🎯 Completion Rate: ${completionRate}%`;

      return createSuccessResponse(milestoneDetails);
    } catch (error) {
      return createErrorResponse(`Failed to get sprint details: ${error.message}`);
    }
  }
};

/**
 * Tool to create a new sprint
 */
export const createSprintTool = {
  name: 'createMilestone',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    name: z.string().describe('Sprint name'),
    estimatedStart: z.string().optional().describe('Estimated start date (YYYY-MM-DD)'),
    estimatedFinish: z.string().optional().describe('Estimated finish date (YYYY-MM-DD)'),
  },
  handler: async ({ projectIdentifier, name, estimatedStart, estimatedFinish }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);

      // Create the milestone
      const milestoneData = {
        project: projectId,
        name,
        estimated_start: estimatedStart,
        estimated_finish: estimatedFinish,
      };

      const createdMilestone = await taigaService.createMilestone(milestoneData);

      const creationDetails = `${SUCCESS_MESSAGES.SPRINT_CREATED}

Name: ${createdMilestone.name}
ID: ${createdMilestone.id}
Start Date: ${getSafeValue(createdMilestone.estimated_start, 'Not set')}
End Date: ${getSafeValue(createdMilestone.estimated_finish, 'Not set')}
Project: ${getSafeValue(createdMilestone.project_extra_info?.name)}
Status: ${getStatusLabel(createdMilestone.closed)}`;

      return createSuccessResponse(creationDetails);
    } catch (error) {
      return createErrorResponse(`Failed to create sprint: ${error.message}`);
    }
  }
};

/**
 * Tool to get issues by sprint
 */
export const getIssuesBySprintTool = {
  name: 'getIssuesByMilestone',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    milestoneId: z.string().describe('Sprint (Milestone) ID'),
  },
  handler: async ({ projectIdentifier, milestoneId }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);

      // Get milestone details and issues
      const [milestone, issues] = await Promise.all([
        taigaService.getMilestone(milestoneId),
        taigaService.getIssuesByMilestone(projectId, milestoneId)
      ]);

      if (issues.length === 0) {
        return createErrorResponse(`No issues found in Sprint: ${milestone.name}`);
      }

      const sprintOverview = `Issues in Sprint: ${milestone.name}

📊 Sprint Overview:
- Sprint: ${milestone.name}
- Status: ${getStatusLabel(milestone.closed)}
- Duration: ${formatDate(milestone.estimated_start)} ~ ${formatDate(milestone.estimated_finish)}
- Total Issues: ${issues.length}

📋 Issues List:
${formatSprintIssues(issues)}`;

      return createSuccessResponse(sprintOverview);
    } catch (error) {
      return createErrorResponse(`Failed to get issues by sprint: ${error.message}`);
    }
  }
};