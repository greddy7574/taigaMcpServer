/**
 * User Story related MCP tools
 */

import { z } from 'zod';
import { TaigaService } from '../taigaService.js';
import { RESPONSE_TEMPLATES, SUCCESS_MESSAGES, STATUS_LABELS } from '../constants.js';
import {
  resolveProjectId,
  findIdByName,
  formatUserStoryList,
  formatDateTime,
  getSafeValue,
  createErrorResponse,
  createSuccessResponse
} from '../utils.js';

const taigaService = new TaigaService();

/**
 * Tool to list user stories in a project
 */
export const listUserStoriesTool = {
  name: 'listUserStories',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
  },
  handler: async ({ projectIdentifier }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);
      const userStories = await taigaService.listUserStories(projectId);

      if (userStories.length === 0) {
        return createErrorResponse(RESPONSE_TEMPLATES.NO_USER_STORIES);
      }

      const userStoriesText = `User Stories in Project:\n\n${formatUserStoryList(userStories)}`;
      return createSuccessResponse(userStoriesText);
    } catch (error) {
      return createErrorResponse(`Failed to list user stories: ${error.message}`);
    }
  }
};

/**
 * Tool to get single user story details
 */
export const getUserStoryTool = {
  name: 'getUserStory',
  schema: {
    userStoryId: z.string().describe('User Story ID'),
  },
  handler: async ({ userStoryId }) => {
    try {
      const userStory = await taigaService.getUserStory(userStoryId);

      const storyDetails = `User Story Details: #${userStory.ref} - ${userStory.subject}

📋 Basic Information:
- Project: ${getSafeValue(userStory.project_extra_info?.name)}
- Status: ${getSafeValue(userStory.status_extra_info?.name)}
- Epic: ${getSafeValue(userStory.epic_extra_info?.subject, 'No Epic')}

🎯 Assignment:
- Assigned to: ${getSafeValue(userStory.assigned_to_extra_info?.full_name, 'Unassigned')}
- Sprint: ${getSafeValue(userStory.milestone_extra_info?.name, 'No Sprint')}

📊 Metrics:
- Points: ${getSafeValue(userStory.total_points, '0')}
- Tasks: ${userStory.tasks?.length || 0}

📝 Description:
${getSafeValue(userStory.description, 'No description')}

🏷️ Tags: ${getSafeValue(userStory.tags?.join(', '), 'No tags')}`;

      return createSuccessResponse(storyDetails);
    } catch (error) {
      return createErrorResponse(`Failed to get user story details: ${error.message}`);
    }
  }
};

/**
 * Tool to create a new user story
 */
export const createUserStoryTool = {
  name: 'createUserStory',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    subject: z.string().describe('User story title/subject'),
    description: z.string().optional().describe('User story description'),
    status: z.string().optional().describe('Status name (e.g., "New", "In progress")'),
    tags: z.array(z.string()).optional().describe('Array of tags'),
  },
  handler: async ({ projectIdentifier, subject, description, status, tags }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);

      // Get status ID if a status name was provided
      let statusId = undefined;
      if (status) {
        const statuses = await taigaService.getUserStoryStatuses(projectId);
        statusId = findIdByName(statuses, status);
      }

      // Create the user story
      const userStoryData = {
        project: projectId,
        subject,
        description,
        status: statusId,
        tags,
      };

      const createdStory = await taigaService.createUserStory(userStoryData);

      const creationDetails = `${SUCCESS_MESSAGES.USER_STORY_CREATED}

Subject: ${createdStory.subject}
Reference: #${createdStory.ref}
Status: ${getSafeValue(createdStory.status_extra_info?.name, 'Default status')}
Project: ${getSafeValue(createdStory.project_extra_info?.name)}`;

      return createSuccessResponse(creationDetails);
    } catch (error) {
      return createErrorResponse(`Failed to create user story: ${error.message}`);
    }
  }
};

/**
 * Tool to assign a user story to a sprint
 */
export const assignUserStoryToSprintTool = {
  name: 'assignUserStoryToSprint',
  schema: {
    userStoryId: z.string().describe('User Story ID'),
    milestoneId: z.string().optional().describe('Milestone (Sprint) ID. Set to null or omit to unassign from sprint.'),
  },
  handler: async ({ userStoryId, milestoneId }) => {
    try {
      const updateData = {
        milestone: milestoneId === 'null' || !milestoneId ? null : parseInt(milestoneId),
      };

      const updatedStory = await taigaService.updateUserStory(userStoryId, updateData);

      const status = updatedStory.milestone ?
        `User story #${updatedStory.ref} assigned to sprint ${updatedStory.milestone_extra_info?.name}` :
        `User story #${updatedStory.ref} unassigned from sprint`;

      return createSuccessResponse(status);
    } catch (error) {
      return createErrorResponse(`Failed to assign user story to sprint: ${error.message}`);
    }
  }
};

/**
 * Tool to update the status of a user story
 * Mirrors updateIssueStatus functionality for user stories
 */
export const updateUserStoryStatusTool = {
  name: 'updateUserStoryStatus',
  schema: {
    userStoryId: z.string().describe('User Story ID or reference number'),
    status: z.string().describe('Name of the target status (e.g., "New", "Ready", "In Progress", "Done")'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using reference number)'),
  },
  handler: async ({ userStoryId, status, projectIdentifier }) => {
    try {
      // Get the user story first to determine project
      const userStory = await taigaService.getUserStory(userStoryId);
      const projectId = userStory.project;

      // Get available statuses for this project
      const statuses = await taigaService.getUserStoryStatuses(projectId);
      const statusId = findIdByName(statuses, status);

      if (!statusId) {
        const availableStatuses = statuses.map(s => `- ${s.name} (ID: ${s.id})`).join('\n');
        return createErrorResponse(
          `Invalid status name: "${status}". Available statuses for project "${userStory.project_extra_info?.name}":\n${availableStatuses}`
        );
      }

      // Update the user story status
      const updatedStory = await taigaService.updateUserStory(userStoryId, { status: statusId });

      const successMessage = `Successfully updated status for user story #${updatedStory.ref} to "${updatedStory.status_extra_info?.name}".

User Story Details:
- Subject: ${updatedStory.subject}
- Project: ${getSafeValue(updatedStory.project_extra_info?.name)}
- New Status: ${getSafeValue(updatedStory.status_extra_info?.name)}
- Assigned to: ${getSafeValue(updatedStory.assigned_to_extra_info?.full_name, 'Unassigned')}
- Sprint: ${getSafeValue(updatedStory.milestone_extra_info?.name, 'No Sprint')}`;

      return createSuccessResponse(successMessage);
    } catch (error) {
      return createErrorResponse(`Failed to update user story status: ${error.message}`);
    }
  }
};