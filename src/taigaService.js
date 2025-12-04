import { createAuthenticatedClient, getAuthToken } from './taigaAuth.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from './constants.js';
import { fetchAllPaginated } from './pagination.js';

/**
 * Service for interacting with the Taiga API
 */
export class TaigaService {
  /**
   * Check if user is authenticated
   * @returns {boolean} - Whether user has valid authentication
   */
  isAuthenticated() {
    try {
      // Check if we have the required environment variables
      const username = process.env.TAIGA_USERNAME;
      const password = process.env.TAIGA_PASSWORD;
      return !!(username && password);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a list of all projects the user has access to
   * @returns {Promise<Array>} - List of projects
   */
  async listProjects() {
    try {
      const client = await createAuthenticatedClient();

      // First get current user information
      const currentUser = await this.getCurrentUser();
      const userId = currentUser.id;

      // Fetch all projects with pagination support
      const fetchPage = async (params) => {
        return await client.get(API_ENDPOINTS.PROJECTS, {
          params: {
            member: userId,
            ...params
          }
        });
      };

      const allProjects = await fetchAllPaginated(fetchPage);
      return allProjects;
    } catch (error) {
      console.error('Failed to list projects:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LIST_PROJECTS);
    }
  }

  /**
   * Get details of a specific project
   * @param {string} projectId - Project ID or slug
   * @returns {Promise<Object>} - Project details
   */
  async getProject(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`${API_ENDPOINTS.PROJECTS}/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get project ${projectId}:`, error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_PROJECT);
    }
  }

  /**
   * Get a project by its slug
   * @param {string} slug - Project slug
   * @returns {Promise<Object>} - Project details
   */
  async getProjectBySlug(slug) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`/projects/by_slug?slug=${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get project by slug ${slug}:`, error.message);
      throw new Error(`Failed to get project details from Taiga`);
    }
  }

  /**
   * List user stories for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of user stories
   */
  async listUserStories(projectId) {
    try {
      const client = await createAuthenticatedClient();

      // Fetch all user stories with pagination support
      const fetchPage = async (params) => {
        return await client.get(API_ENDPOINTS.USER_STORIES, {
          params: {
            project: projectId,
            ...params
          }
        });
      };

      const allUserStories = await fetchAllPaginated(fetchPage);
      return allUserStories;
    } catch (error) {
      console.error(`Failed to list user stories for project ${projectId}:`, error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LIST_USER_STORIES);
    }
  }

  /**
   * Get details of a specific user story
   * @param {string} userStoryId - User Story ID
   * @returns {Promise<Object>} - User story details
   */
  async getUserStory(userStoryId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`${API_ENDPOINTS.USER_STORIES}/${userStoryId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get user story ${userStoryId}:`, error.message);
      throw new Error('Failed to get user story details from Taiga');
    }
  }

  /**
   * Create a new user story in a project
   * @param {Object} userStoryData - User story data
   * @param {string} userStoryData.project - Project ID
   * @param {string} userStoryData.subject - User story subject/title
   * @param {string} [userStoryData.description] - User story description
   * @param {number} [userStoryData.status] - Status ID
   * @param {Array} [userStoryData.tags] - Array of tags
   * @returns {Promise<Object>} - Created user story
   */
  async createUserStory(userStoryData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post(API_ENDPOINTS.USER_STORIES, userStoryData);
      return response.data;
    } catch (error) {
      console.error('Failed to create user story:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_CREATE_USER_STORY);
    }
  }

  /**
   * Get user story statuses for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of user story statuses
   */
  async getUserStoryStatuses(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(API_ENDPOINTS.USER_STORY_STATUSES, {
        params: { project: projectId }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get user story statuses for project ${projectId}:`, error.message);
      throw new Error('Failed to get user story statuses from Taiga');
    }
  }

  /**
   * Get the current user's information
   * @returns {Promise<Object>} - User information
   */
  async getCurrentUser() {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(API_ENDPOINTS.USERS_ME);
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error.message);
      throw new Error('Failed to get user information from Taiga');
    }
  }

  /**
   * Create a new task associated with a user story
   * @param {Object} taskData - Task data
   * @param {string} taskData.project - Project ID
   * @param {string} taskData.subject - Task subject/title
   * @param {string} [taskData.description] - Task description
   * @param {string} [taskData.user_story] - User story ID
   * @param {string} [taskData.status] - Status ID
   * @param {Array} [taskData.tags] - Array of tags
   * @returns {Promise<Object>} - Created task
   */
  async createTask(taskData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post(API_ENDPOINTS.TASKS, taskData);
      return response.data;
    } catch (error) {
      console.error('Failed to create task:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_CREATE_TASK);
    }
  }

  /**
   * Get task statuses for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of task statuses
   */
  async getTaskStatuses(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(API_ENDPOINTS.TASK_STATUSES, {
        params: { project: projectId }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get task statuses for project ${projectId}:`, error.message);
      throw new Error('Failed to get task statuses from Taiga');
    }
  }

  /**
   * List issues for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of issues
   */
  async listIssues(projectId) {
    try {
      const client = await createAuthenticatedClient();

      // Fetch all issues with pagination support
      const fetchPage = async (params) => {
        return await client.get(API_ENDPOINTS.ISSUES, {
          params: {
            project: projectId,
            ...params
          }
        });
      };

      const allIssues = await fetchAllPaginated(fetchPage);
      return allIssues;
    } catch (error) {
      console.error(`Failed to list issues for project ${projectId}:`, error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LIST_ISSUES);
    }
  }

  /**
   * Create a new issue in a project
   * @param {Object} issueData - Issue data
   * @param {string} issueData.project - Project ID
   * @param {string} issueData.subject - Issue subject/title
   * @param {string} [issueData.description] - Issue description
   * @param {number} [issueData.status] - Status ID
   * @param {number} [issueData.priority] - Priority ID
   * @param {number} [issueData.severity] - Severity ID
   * @param {number} [issueData.type] - Issue type ID
   * @param {number} [issueData.assigned_to] - Assigned user ID
   * @param {Array} [issueData.tags] - Array of tags
   * @returns {Promise<Object>} - Created issue
   */
  async createIssue(issueData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post(API_ENDPOINTS.ISSUES, issueData);
      return response.data;
    } catch (error) {
      console.error('Failed to create issue:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_CREATE_ISSUE);
    }
  }

  /**
   * Get issue statuses for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of issue statuses
   */
  async getIssueStatuses(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(API_ENDPOINTS.ISSUE_STATUSES, {
        params: { project: projectId }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get issue statuses for project ${projectId}:`, error.message);
      throw new Error('Failed to get issue statuses from Taiga');
    }
  }

  /**
   * Get issue priorities for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of issue priorities
   */
  async getIssuePriorities(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(API_ENDPOINTS.PRIORITIES, {
        params: { project: projectId }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get issue priorities for project ${projectId}:`, error.message);
      throw new Error('Failed to get issue priorities from Taiga');
    }
  }

  /**
   * Get issue severities for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of issue severities
   */
  async getIssueSeverities(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(API_ENDPOINTS.SEVERITIES, {
        params: { project: projectId }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get issue severities for project ${projectId}:`, error.message);
      throw new Error('Failed to get issue severities from Taiga');
    }
  }

  /**
   * Get issue types for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of issue types
   */
  async getIssueTypes(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(API_ENDPOINTS.ISSUE_TYPES, {
        params: { project: projectId }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get issue types for project ${projectId}:`, error.message);
      throw new Error('Failed to get issue types from Taiga');
    }
  }

  /**
   * Get project members (for issue assignment)
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of project members
   */
  async getProjectMembers(projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(API_ENDPOINTS.MEMBERSHIPS, {
        params: { project: projectId }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get project members for project ${projectId}:`, error.message);
      throw new Error('Failed to get project members from Taiga');
    }
  }

  /**
   * Update an issue
   * @param {number} issueId - Issue ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated issue
   */
  async updateIssue(issueId, updateData) {
    try {
      const client = await createAuthenticatedClient();
      
      // Get current issue to get version for update
      const currentIssue = await this.getIssue(issueId);
      const dataWithVersion = {
        ...updateData,
        version: currentIssue.version
      };

      const response = await client.patch(`${API_ENDPOINTS.ISSUES}/${issueId}`, dataWithVersion);
      return response.data;
    } catch (error) {
      console.error('Failed to update issue:', error.message);
      throw new Error('Failed to update issue in Taiga');
    }
  }

  /**
   * List milestones (sprints) for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of milestones
   */
  async listMilestones(projectId) {
    try {
      const client = await createAuthenticatedClient();

      // Fetch all milestones with pagination support
      const fetchPage = async (params) => {
        return await client.get(API_ENDPOINTS.MILESTONES, {
          params: {
            project: projectId,
            ...params
          }
        });
      };

      const allMilestones = await fetchAllPaginated(fetchPage);
      return allMilestones;
    } catch (error) {
      console.error(`Failed to list milestones for project ${projectId}:`, error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LIST_MILESTONES);
    }
  }

  /**
   * Get details of a specific milestone (sprint)
   * @param {string} milestoneId - Milestone ID
   * @returns {Promise<Object>} - Milestone details
   */
  async getMilestone(milestoneId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`${API_ENDPOINTS.MILESTONES}/${milestoneId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get milestone ${milestoneId}:`, error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_MILESTONE);
    }
  }

  /**
   * Get statistics for a specific milestone (sprint)
   * @param {string} milestoneId - Milestone ID
   * @returns {Promise<Object>} - Milestone statistics
   */
  async getMilestoneStats(milestoneId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`${API_ENDPOINTS.MILESTONES}/${milestoneId}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get milestone stats for ${milestoneId}:`, error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_MILESTONE_STATS);
    }
  }

  /**
   * Get details of a specific issue
   * @param {string} issueId - Issue ID
   * @returns {Promise<Object>} - Issue details
   */
  async getIssue(issueId) {
    try {
      const client = await createAuthenticatedClient();
      const url = `${API_ENDPOINTS.ISSUES}/${issueId}`;
      const response = await client.get(url);
      return response.data;
    } catch (error) {
      console.error(`Failed to get issue ${issueId}:`, error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_ISSUE);
    }
  }

  /**
   * Get issue by reference number
   * @param {string} ref - Issue reference number
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} - Issue details
   */
  async getIssueByRef(ref, projectId) {
    try {
      const client = await createAuthenticatedClient();
      const url = `${API_ENDPOINTS.ISSUES}/by_ref`;
      const params = { ref, project: projectId };
      const response = await client.get(url, { params });
      return response.data;
    } catch (error) {
      console.error(`Failed to get issue by ref ${ref}:`, error.message);
      throw new Error('Failed to get issue by reference from Taiga');
    }
  }

  /**
   * List issues filtered by milestone (sprint)
   * @param {string} projectId - Project ID
   * @param {string} milestoneId - Milestone ID
   * @returns {Promise<Array>} - List of issues in the milestone
   */
  async getIssuesByMilestone(projectId, milestoneId) {
    try {
      const client = await createAuthenticatedClient();

      // Fetch all issues for milestone with pagination support
      const fetchPage = async (params) => {
        return await client.get(API_ENDPOINTS.ISSUES, {
          params: {
            project: projectId,
            milestone: milestoneId,
            ...params
          }
        });
      };

      const allIssues = await fetchAllPaginated(fetchPage);
      return allIssues;
    } catch (error) {
      console.error(`Failed to get issues for milestone ${milestoneId}:`, error.message);
      throw new Error('Failed to get issues by milestone from Taiga');
    }
  }

  /**
   * Create a new milestone (sprint) in a project
   * @param {Object} milestoneData - Milestone data
   * @param {string} milestoneData.project - Project ID
   * @param {string} milestoneData.name - Milestone name
   * @param {string} [milestoneData.estimated_start] - Estimated start date (YYYY-MM-DD)
   * @param {string} [milestoneData.estimated_finish] - Estimated finish date (YYYY-MM-DD)
   * @param {boolean} [milestoneData.disponibility] - Availability percentage
   * @returns {Promise<Object>} - Created milestone
   */
  async createMilestone(milestoneData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post(API_ENDPOINTS.MILESTONES, milestoneData);
      return response.data;
    } catch (error) {
      console.error('Failed to create milestone:', error.message);
      throw new Error('Failed to create milestone in Taiga');
    }
  }

  /**
   * Add comment to an item (issue, user story, or task)
   * @param {string} itemType - Type of item ('issue', 'user_story', 'task')
   * @param {number} itemId - ID of the item
   * @param {Object} commentData - Comment data
   * @returns {Promise<Object>} - Created comment
   */
  async addComment(itemType, itemId, commentData) {
    try {
      const client = await createAuthenticatedClient();
      
      // 首先获取当前项目版本（必需用于版本控制）
      const currentVersion = await this.getItemVersion(itemType, itemId);
      
      // Taiga使用歷史API來處理評論
      // 通過更新項目並添加評論來創建評論記錄
      const endpoint = this.getItemEndpoint(itemType);
      
      const updateData = {
        comment: commentData.comment,
        version: currentVersion
      };
      
      const response = await client.patch(`${endpoint}/${itemId}`, updateData);
      return response.data;
    } catch (error) {
      // 提供更具体的错误信息
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.version ? 
          'Version parameter is invalid. The item may have been modified by another user.' :
          'Bad request. Please check the comment data format.';
        throw new Error(`Failed to add comment to Taiga: ${errorMsg}`);
      } else if (error.response?.status === 403) {
        throw new Error('Failed to add comment to Taiga: Permission denied. Check your access rights.');
      } else if (error.response?.status === 404) {
        throw new Error(`Failed to add comment to Taiga: ${itemType} #${itemId} not found.`);
      } else {
        throw new Error(`Failed to add comment to Taiga: ${error.message}`);
      }
    }
  }

  /**
   * Get history/comments for an item
   * @param {string} itemType - Type of item ('issue', 'user_story', 'task')  
   * @param {number} itemId - ID of the item
   * @returns {Promise<Array>} - History entries including comments
   */
  async getItemHistory(itemType, itemId) {
    try {
      const client = await createAuthenticatedClient();
      const objectType = this.getHistoryObjectType(itemType);
      const response = await client.get(`${API_ENDPOINTS.HISTORY}/${objectType}/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get item history:', error.message);
      throw new Error('Failed to get item history from Taiga');
    }
  }

  /**
   * Edit a comment
   * @param {number} commentId - ID of the comment  
   * @param {string} newComment - New comment content
   * @returns {Promise<Object>} - Updated comment
   */
  async editComment(commentId, newComment) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.patch(`${API_ENDPOINTS.HISTORY}/edit-comment`, {
        id: commentId,
        comment: newComment
      });
      return response.data;
    } catch (error) {
      console.error('Failed to edit comment:', error.message);
      throw new Error('Failed to edit comment in Taiga');
    }
  }

  /**
   * Delete a comment
   * @param {number} commentId - ID of the comment to delete
   * @returns {Promise<void>}
   */
  async deleteComment(commentId) {
    try {
      const client = await createAuthenticatedClient();
      await client.delete(`${API_ENDPOINTS.HISTORY}/delete-comment`, {
        data: { id: commentId }
      });
    } catch (error) {
      console.error('Failed to delete comment:', error.message);
      throw new Error('Failed to delete comment from Taiga');
    }
  }

  /**
   * Get current user ID
   * @returns {Promise<number>} - Current user ID
   */
  async getCurrentUserId() {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(API_ENDPOINTS.USERS_ME);
      return response.data.id;
    } catch (error) {
      console.error('Failed to get current user:', error.message);
      throw new Error('Failed to get current user from Taiga');
    }
  }

  /**
   * Get item endpoint based on type
   * @private
   */
  getItemEndpoint(itemType) {
    const endpoints = {
      'issue': API_ENDPOINTS.ISSUES,
      'user_story': API_ENDPOINTS.USER_STORIES,
      'task': API_ENDPOINTS.TASKS
    };
    return endpoints[itemType] || API_ENDPOINTS.ISSUES;
  }

  /**
   * Get history object type based on item type
   * @private
   */
  getHistoryObjectType(itemType) {
    const types = {
      'issue': 'issue',
      'user_story': 'userstory',
      'task': 'task'
    };
    return types[itemType] || 'issue';
  }

  /**
   * Get current version of an item (needed for comment updates)
   * @private
   */
  async getItemVersion(itemType, itemId) {
    try {
      const client = await createAuthenticatedClient();
      const endpoint = this.getItemEndpoint(itemType);
      const response = await client.get(`${endpoint}/${itemId}`);
      
      const version = response.data.version;
      
      if (typeof version !== 'number') {
        return 1; // 默認版本
      }
      
      return version;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`${itemType} #${itemId} not found`);
      } else if (error.response?.status === 403) {
        throw new Error(`Permission denied accessing ${itemType} #${itemId}`);
      } else {
        throw new Error(`Failed to get ${itemType} version: ${error.message}`);
      }
    }
  }

  /**
   * Upload attachment to an item (issue, user story, or task)
   * @param {string} itemType - Type of item ('issue', 'user_story', 'task')
   * @param {number} itemId - ID of the item
   * @param {string} fileData - Base64 encoded file data
   * @param {string} fileName - Original file name
   * @param {string} [mimeType] - MIME type of the file
   * @param {string} [description] - Optional description for the attachment
   * @returns {Promise<Object>} - Created attachment
   */
  async uploadAttachment(itemType, itemId, fileData, fileName, mimeType, description) {
    try {
      
      // Import required modules
      const FormData = (await import('form-data')).default;
      
      // Get authenticated client to ensure we have a valid token
      const client = await createAuthenticatedClient();
      const token = await getAuthToken();
      
      // Get attachment endpoint based on item type
      const endpoint = this.getAttachmentEndpoint(itemType);
      
      // Validate required parameters
      if (!fileData || typeof fileData !== 'string') {
        throw new Error(`Invalid file data: fileData must be a base64 encoded string`);
      }
      
      if (!fileName || typeof fileName !== 'string') {
        throw new Error(`Invalid file name: fileName is required`);
      }
      
      // Convert base64 to buffer
      let fileBuffer;
      try {
        // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
        const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
        fileBuffer = Buffer.from(base64Data, 'base64');
      } catch (error) {
        throw new Error(`Invalid base64 data: ${error.message}`);
      }
      
      // Create FormData instance
      const formData = new FormData();
      formData.append('object_id', itemId.toString());
      
      // Append file buffer - 使用更簡單的格式
      // 某些版本的 form-data 可能對第三個參數格式敏感
      formData.append('attached_file', fileBuffer, fileName);
      
      if (description) {
        formData.append('description', description);
      }
      
      // 嘗試添加項目ID（可能是必需的）
      try {
        const itemData = await this.getItemData(itemType, itemId);
        if (itemData && itemData.project) {
          formData.append('project', itemData.project.toString());
        }
      } catch (projectError) {
        // 靜默忽略項目ID獲取失敗，繼續上傳
      }

      // Use axios with FormData (client already has auth headers)
      const response = await client.post(endpoint, formData, {
        headers: {
          ...formData.getHeaders()
          // Don't add Authorization header - client already has it
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      
      return response.data;
      
    } catch (error) {
      
      // Provide more specific error information
      if (error.message.includes('Invalid base64')) {
        throw new Error(`Invalid file data format: ${error.message}`);
      } else if (error.message.includes('cb is not a function')) {
        console.error('Callback error detected - this might be a form-data compatibility issue');
        throw new Error('Upload failed due to form-data callback issue');
      } else if (error.response?.status === 413) {
        throw new Error('File too large for upload');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed - please check credentials');
      } else if (error.response?.status === 404) {
        throw new Error('Upload endpoint not found - check item ID and type');
      }
      
      throw new Error(`Failed to upload attachment to Taiga: ${error.message}`);
    }
  }

  /**
   * Upload attachment from file path (legacy method for backward compatibility)
   * @param {string} itemType - Type of item ('issue', 'user_story', 'task')
   * @param {number} itemId - ID of the item
   * @param {string} filePath - Path to the file to upload
   * @param {string} [description] - Optional description for the attachment
   * @returns {Promise<Object>} - Created attachment
   */
  async uploadAttachmentFromPath(itemType, itemId, filePath, description) {
    try {
      
      // Import required modules
      const fs = await import('fs');
      const path = await import('path');
      
      // Validate filePath parameter
      if (!filePath || typeof filePath !== 'string') {
        throw new Error(`Invalid file path: ${filePath}`);
      }
      
      // Check if file exists - try multiple path resolution strategies
      let absolutePath;
      let fileExists = false;
      
      if (path.default.isAbsolute(filePath)) {
        // If already absolute, use as-is
        absolutePath = filePath;
        fileExists = fs.default.existsSync(absolutePath);
      } else {
        // For relative paths, try different resolution strategies
        const os = await import('os');
        const homeDir = process.env.HOME || process.env.USERPROFILE || os.default.homedir();
        const possiblePaths = [
          // 1. Relative to current working directory
          path.default.resolve(process.cwd(), filePath),
          // 2. Relative to user's home directory
          path.default.resolve(homeDir, filePath),
          // 3. Relative to Desktop (common location for downloaded files)
          path.default.resolve(homeDir, 'Desktop', filePath),
          // 4. Relative to Downloads (another common location)
          path.default.resolve(homeDir, 'Downloads', filePath)
        ];
        
        for (const tryPath of possiblePaths) {
          if (fs.default.existsSync(tryPath)) {
            absolutePath = tryPath;
            fileExists = true;
            break;
          }
        }
      }
      
      if (!fileExists) {
        const os = await import('os');
        const homeDir = process.env.HOME || process.env.USERPROFILE || os.default.homedir();
        const searchedPaths = path.default.isAbsolute(filePath) 
          ? [filePath]
          : [
              path.default.resolve(process.cwd(), filePath),
              path.default.resolve(homeDir, filePath),
              path.default.resolve(homeDir, 'Desktop', filePath),
              path.default.resolve(homeDir, 'Downloads', filePath)
            ];
        throw new Error(`File not found. Searched paths:\n${searchedPaths.join('\n')}`);
      }
      
      // Convert file to base64 and use the new method
      const fileBuffer = fs.default.readFileSync(absolutePath);
      const fileData = fileBuffer.toString('base64');
      const fileName = path.default.basename(absolutePath);
      
      // Detect MIME type
      const mimeType = this.detectMimeType(fileName);
      
      // Use the new base64 upload method
      return await this.uploadAttachment(itemType, itemId, fileData, fileName, mimeType, description);
      
    } catch (error) {
      throw new Error(`Failed to upload attachment from path: ${error.message}`);
    }
  }

  /**
   * Detect MIME type from file extension
   * @param {string} fileName - File name
   * @returns {string} - MIME type
   */
  detectMimeType(fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'zip': 'application/zip',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * List attachments for an item
   * @param {string} itemType - Type of item ('issue', 'user_story', 'task')
   * @param {number} itemId - ID of the item
   * @returns {Promise<Array>} - List of attachments
   */
  async listAttachments(itemType, itemId) {
    try {
      const client = await createAuthenticatedClient();
      const endpoint = this.getAttachmentEndpoint(itemType);
      
      const response = await client.get(endpoint, {
        params: {
          object_id: itemId
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to list attachments:', error.message);
      throw new Error('Failed to list attachments from Taiga');
    }
  }

  /**
   * Download attachment by ID
   * @param {number} attachmentId - ID of the attachment
   * @param {string} [downloadPath] - Optional path to save the file
   * @returns {Promise<Object>} - Download result with filename and path
   */
  async downloadAttachment(attachmentId, downloadPath) {
    try {
      const client = await createAuthenticatedClient();
      const fs = await import('fs');
      const path = await import('path');
      
      // First get attachment details
      const attachmentResponse = await client.get(`${API_ENDPOINTS.ISSUE_ATTACHMENTS}/${attachmentId}`);
      const attachment = attachmentResponse.data;
      
      // Download the file
      const fileResponse = await client.get(attachment.url, {
        responseType: 'stream'
      });
      
      // Determine save path
      const filename = attachment.name || `attachment_${attachmentId}`;
      const savedPath = downloadPath || path.default.join(process.cwd(), filename);
      
      // Save file
      const writer = fs.default.createWriteStream(savedPath);
      fileResponse.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          resolve({
            filename,
            savedPath,
            size: attachment.size
          });
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Failed to download attachment:', error.message);
      throw new Error('Failed to download attachment from Taiga');
    }
  }

  /**
   * Delete attachment by ID
   * @param {number} attachmentId - ID of the attachment to delete
   * @returns {Promise<void>}
   */
  async deleteAttachment(attachmentId) {
    try {
      const client = await createAuthenticatedClient();
      await client.delete(`${API_ENDPOINTS.ISSUE_ATTACHMENTS}/${attachmentId}`);
    } catch (error) {
      console.error('Failed to delete attachment:', error.message);
      throw new Error('Failed to delete attachment from Taiga');
    }
  }

  /**
   * Get item data (to extract project info)
   * @private
   */
  async getItemData(itemType, itemId) {
    const client = await createAuthenticatedClient();
    const endpoint = this.getItemEndpoint(itemType);
    const response = await client.get(`${endpoint}/${itemId}`);
    return response.data;
  }

  /**
   * Get attachment endpoint based on item type
   * @private
   */
  getAttachmentEndpoint(itemType) {
    const endpoints = {
      'issue': API_ENDPOINTS.ISSUE_ATTACHMENTS,
      'user_story': API_ENDPOINTS.USERSTORY_ATTACHMENTS,
      'task': API_ENDPOINTS.TASK_ATTACHMENTS
    };
    return endpoints[itemType] || API_ENDPOINTS.ISSUE_ATTACHMENTS;
  }

  /**
   * Create a new Epic
   * @param {Object} epicData - Epic data
   * @returns {Promise<Object>} - Created Epic
   */
  async createEpic(epicData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post(API_ENDPOINTS.EPICS, epicData);
      return response.data;
    } catch (error) {
      console.error('Failed to create epic:', error.message);
      throw new Error('Failed to create epic in Taiga');
    }
  }

  /**
   * List all Epics in a project
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} - List of Epics
   */
  async listEpics(projectId) {
    try {
      const client = await createAuthenticatedClient();

      // Fetch all epics with pagination support
      const fetchPage = async (params) => {
        return await client.get(API_ENDPOINTS.EPICS, {
          params: {
            project: projectId,
            ...params
          }
        });
      };

      const allEpics = await fetchAllPaginated(fetchPage);
      return allEpics;
    } catch (error) {
      console.error('Failed to list epics:', error.message);
      throw new Error('Failed to list epics from Taiga');
    }
  }

  /**
   * Get Epic details by ID
   * @param {number} epicId - Epic ID
   * @returns {Promise<Object>} - Epic details
   */
  async getEpic(epicId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`${API_ENDPOINTS.EPICS}/${epicId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get epic:', error.message);
      throw new Error('Failed to get epic details from Taiga');
    }
  }

  /**
   * Update Epic
   * @param {number} epicId - Epic ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated Epic
   */
  async updateEpic(epicId, updateData) {
    try {
      const client = await createAuthenticatedClient();
      
      // Get current Epic to get version for update
      const currentEpic = await this.getEpic(epicId);
      const dataWithVersion = {
        ...updateData,
        version: currentEpic.version
      };
      
      const response = await client.patch(`${API_ENDPOINTS.EPICS}/${epicId}`, dataWithVersion);
      return response.data;
    } catch (error) {
      console.error('Failed to update epic:', error.message);
      throw new Error('Failed to update epic in Taiga');
    }
  }

  /**
   * Link User Story to Epic
   * @param {number} userStoryId - User Story ID
   * @param {number} epicId - Epic ID
   * @returns {Promise<Object>} - Updated User Story
   */
  async linkStoryToEpic(userStoryId, epicId) {
    try {
      const client = await createAuthenticatedClient();
      
      // Get current User Story to get version for update
      const currentStory = await client.get(`${API_ENDPOINTS.USER_STORIES}/${userStoryId}`);
      const updateData = {
        epic: epicId,
        version: currentStory.data.version
      };
      
      const response = await client.patch(`${API_ENDPOINTS.USER_STORIES}/${userStoryId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to link story to epic:', error.message);
      throw new Error('Failed to link user story to epic');
    }
  }

  /**
   * Unlink User Story from Epic
   * @param {number} userStoryId - User Story ID
   * @returns {Promise<Object>} - Updated User Story
   */
  async unlinkStoryFromEpic(userStoryId) {
    try {
      const client = await createAuthenticatedClient();
      
      // Get current User Story to get version for update
      const currentStory = await client.get(`${API_ENDPOINTS.USER_STORIES}/${userStoryId}`);
      const updateData = {
        epic: null,
        version: currentStory.data.version
      };
      
      const response = await client.patch(`${API_ENDPOINTS.USER_STORIES}/${userStoryId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to unlink story from epic:', error.message);
      throw new Error('Failed to unlink user story from epic');
    }
  }

  // ========================= WIKI MANAGEMENT =========================

  /**
   * Create a new Wiki page
   * @param {Object} wikiData - Wiki page data
   * @returns {Promise<Object>} - Created wiki page
   */
  async createWikiPage(wikiData) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post(API_ENDPOINTS.WIKI, wikiData);
      return response.data;
    } catch (error) {
      console.error('Failed to create wiki page:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_CREATE_WIKI);
    }
  }

  /**
   * List all Wiki pages in a project
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} - List of wiki pages
   */
  async listWikiPages(projectId) {
    try {
      const client = await createAuthenticatedClient();

      // Fetch all wiki pages with pagination support
      const fetchPage = async (params) => {
        return await client.get(API_ENDPOINTS.WIKI, {
          params: {
            project: projectId,
            ...params
          }
        });
      };

      const allWikiPages = await fetchAllPaginated(fetchPage);
      return allWikiPages;
    } catch (error) {
      console.error('Failed to list wiki pages:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LIST_WIKI);
    }
  }

  /**
   * Get Wiki page by ID
   * @param {number} wikiPageId - Wiki page ID
   * @returns {Promise<Object>} - Wiki page details
   */
  async getWikiPage(wikiPageId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`${API_ENDPOINTS.WIKI}/${wikiPageId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get wiki page:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_WIKI);
    }
  }

  /**
   * Get Wiki page by slug
   * @param {string} slug - Wiki page slug
   * @param {number} projectId - Project ID
   * @returns {Promise<Object>} - Wiki page details
   */
  async getWikiPageBySlug(slug, projectId) {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.get(`${API_ENDPOINTS.WIKI}/by_slug`, {
        params: { 
          slug: slug,
          project: projectId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get wiki page by slug:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_WIKI);
    }
  }

  /**
   * Update Wiki page
   * @param {number} wikiPageId - Wiki page ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated wiki page
   */
  async updateWikiPage(wikiPageId, updateData) {
    try {
      const client = await createAuthenticatedClient();
      
      // Get current wiki page to get version for update
      const currentWiki = await client.get(`${API_ENDPOINTS.WIKI}/${wikiPageId}`);
      const dataWithVersion = {
        ...updateData,
        version: currentWiki.data.version
      };
      
      const response = await client.patch(`${API_ENDPOINTS.WIKI}/${wikiPageId}`, dataWithVersion);
      return response.data;
    } catch (error) {
      console.error('Failed to update wiki page:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_UPDATE_WIKI);
    }
  }

  /**
   * Delete Wiki page
   * @param {number} wikiPageId - Wiki page ID
   * @returns {Promise<void>}
   */
  async deleteWikiPage(wikiPageId) {
    try {
      const client = await createAuthenticatedClient();
      await client.delete(`${API_ENDPOINTS.WIKI}/${wikiPageId}`);
    } catch (error) {
      console.error('Failed to delete wiki page:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_DELETE_WIKI);
    }
  }

  /**
   * Watch/Unwatch Wiki page
   * @param {number} wikiPageId - Wiki page ID
   * @param {boolean} watch - True to watch, false to unwatch
   * @returns {Promise<Object>} - Response data
   */
  async watchWikiPage(wikiPageId, watch = true) {
    try {
      const client = await createAuthenticatedClient();
      const endpoint = watch ? 
        `${API_ENDPOINTS.WIKI}/${wikiPageId}/watch` : 
        `${API_ENDPOINTS.WIKI}/${wikiPageId}/unwatch`;
      
      const response = await client.post(endpoint);
      return response.data;
    } catch (error) {
      console.error('Failed to watch/unwatch wiki page:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_WATCH_WIKI);
    }
  }
}
