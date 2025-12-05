/**
 * Wiki management tools for Taiga MCP Server
 * Handles Wiki page creation, management, and collaboration features
 */

import { z } from 'zod';
import { TaigaService } from '../taigaService.js';
import { createSuccessResponse, createErrorResponse, resolveProjectId } from '../utils.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, RESPONSE_TEMPLATES } from '../constants.js';

const taigaService = new TaigaService();

/**
 * Create Wiki Page tool
 * Creates a new Wiki page in a project
 */
export const createWikiPageTool = {
  name: 'createWikiPage',
  description: 'Create a new Wiki page in a project for documentation and knowledge sharing',
  schema: {
    project: z.union([z.number(), z.string()]).describe('Project ID, slug, or name'),
    slug: z.string().min(1).describe('URL-friendly identifier for the Wiki page (required)'),
    content: z.string().min(1).describe('Content of the Wiki page - supports Markdown (required)'),
    watchers: z.array(z.number()).optional().describe('Optional list of user IDs to watch this Wiki page'),
  },
  
  handler: async ({ project, slug, content, watchers }) => {
    try {
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Resolve project to get project ID
      const resolvedProject = await resolveProjectId(project);
      if (!resolvedProject) {
        return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      const wikiData = {
        project: resolvedProject.id,
        slug,
        content,
        watchers: watchers || []
      };

      const result = await taigaService.createWikiPage(wikiData);
      
      return createSuccessResponse(
        `${SUCCESS_MESSAGES.WIKI_PAGE_CREATED}\n\n` +
        `📖 **Wiki頁面創建成功**\n` +
        `- Wiki ID: ${result.id}\n` +
        `- Slug: ${result.slug}\n` +
        `- 專案: ${resolvedProject.name}\n` +
        `- 創建時間: ${new Date(result.created_date).toLocaleString()}\n` +
        `- 內容長度: ${result.content?.length || 0} 字符\n` +
        `- 關注者: ${result.watchers?.length || 0} 人`
      );
    } catch (error) {
      console.error('Failed to create wiki page:', error);
      return createErrorResponse(error.message || ERROR_MESSAGES.FAILED_TO_CREATE_WIKI);
    }
  }
};

/**
 * List Wiki Pages tool
 * Lists all Wiki pages in a project
 */
export const listWikiPagesTool = {
  name: 'listWikiPages',
  description: 'List all Wiki pages in a project',
  schema: {
    project: z.union([z.number(), z.string()]).describe('Project ID, slug, or name'),
  },
  
  handler: async ({ project }) => {
    try {
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Resolve project to get project ID
      const resolvedProject = await resolveProjectId(project);
      if (!resolvedProject) {
        return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      const wikiPages = await taigaService.listWikiPages(resolvedProject.id);
      
      if (!wikiPages || wikiPages.length === 0) {
        return createSuccessResponse(
          `📖 **${resolvedProject.name} - Wiki頁面列表**\n\n` +
          `${RESPONSE_TEMPLATES.NO_WIKI_PAGES}`
        );
      }

      const wikiList = wikiPages.map(wiki => 
        `📖 **${wiki.slug}**\n` +
        `   - ID: ${wiki.id}\n` +
        `   - 修改時間: ${new Date(wiki.modified_date).toLocaleString()}\n` +
        `   - 關注者: ${wiki.watchers?.length || 0} 人\n` +
        `   - 內容: ${wiki.content ? `${wiki.content.substring(0, 100)}${wiki.content.length > 100 ? '...' : ''}` : '無內容'}`
      ).join('\n\n');

      return createSuccessResponse(
        `📖 **${resolvedProject.name} - Wiki頁面列表** (${wikiPages.length}個)\n\n` +
        wikiList
      );
    } catch (error) {
      console.error('Failed to list wiki pages:', error);
      return createErrorResponse(error.message || ERROR_MESSAGES.FAILED_TO_LIST_WIKI);
    }
  }
};

/**
 * Get Wiki Page tool
 * Gets detailed information about a specific Wiki page
 */
export const getWikiPageTool = {
  name: 'getWikiPage',
  description: 'Get detailed information about a specific Wiki page by ID or slug',
  schema: {
    project: z.union([z.number(), z.string()]).describe('Project ID, slug, or name'),
    identifier: z.union([z.number(), z.string()]).describe('Wiki page ID (number) or slug (string)'),
  },
  
  handler: async ({ project, identifier }) => {
    try {
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Resolve project to get project ID
      const resolvedProject = await resolveProjectId(project);
      if (!resolvedProject) {
        return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      let wikiPage;
      
      // If identifier is a number, get by ID; if string, get by slug
      if (typeof identifier === 'number') {
        wikiPage = await taigaService.getWikiPage(identifier);
      } else {
        wikiPage = await taigaService.getWikiPageBySlug(identifier, resolvedProject.id);
      }
      
      return createSuccessResponse(
        `📖 **Wiki頁面詳情**\n\n` +
        `**基本信息**\n` +
        `- ID: ${wikiPage.id}\n` +
        `- Slug: ${wikiPage.slug}\n` +
        `- 專案: ${resolvedProject.name}\n` +
        `- 創建時間: ${new Date(wikiPage.created_date).toLocaleString()}\n` +
        `- 修改時間: ${new Date(wikiPage.modified_date).toLocaleString()}\n` +
        `- 版本: ${wikiPage.version}\n\n` +
        `**協作信息**\n` +
        `- 關注者: ${wikiPage.watchers?.length || 0} 人\n` +
        `- 擁有者: ${wikiPage.owner_full_name || '未設定'}\n\n` +
        `**內容**\n` +
        `${wikiPage.content || '此Wiki頁面暫無內容'}`
      );
    } catch (error) {
      console.error('Failed to get wiki page:', error);
      return createErrorResponse(error.message || ERROR_MESSAGES.FAILED_TO_GET_WIKI);
    }
  }
};

/**
 * Update Wiki Page tool
 * Updates content and settings of an existing Wiki page
 */
export const updateWikiPageTool = {
  name: 'updateWikiPage',
  description: 'Update content and settings of an existing Wiki page',
  schema: {
    project: z.union([z.number(), z.string()]).describe('Project ID, slug, or name'),
    identifier: z.union([z.number(), z.string()]).describe('Wiki page ID (number) or slug (string)'),
    content: z.string().optional().describe('New content for the Wiki page (supports Markdown)'),
    watchers: z.array(z.number()).optional().describe('Updated list of user IDs to watch this Wiki page'),
  },
  
  handler: async ({ project, identifier, content, watchers }) => {
    try {
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Resolve project to get project ID
      const resolvedProject = await resolveProjectId(project);
      if (!resolvedProject) {
        return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      // First get the wiki page to get its ID if identifier is a slug
      let wikiPageId;
      if (typeof identifier === 'number') {
        wikiPageId = identifier;
      } else {
        const wikiPage = await taigaService.getWikiPageBySlug(identifier, resolvedProject.id);
        wikiPageId = wikiPage.id;
      }

      // Prepare update data
      const updateData = {};
      if (content !== undefined) updateData.content = content;
      if (watchers !== undefined) updateData.watchers = watchers;

      const result = await taigaService.updateWikiPage(wikiPageId, updateData);
      
      return createSuccessResponse(
        `${SUCCESS_MESSAGES.WIKI_PAGE_UPDATED}\n\n` +
        `📖 **Wiki頁面更新成功**\n` +
        `- Wiki ID: ${result.id}\n` +
        `- Slug: ${result.slug}\n` +
        `- 專案: ${resolvedProject.name}\n` +
        `- 更新時間: ${new Date(result.modified_date).toLocaleString()}\n` +
        `- 版本: ${result.version}\n` +
        `- 內容長度: ${result.content?.length || 0} 字符\n` +
        `- 關注者: ${result.watchers?.length || 0} 人`
      );
    } catch (error) {
      console.error('Failed to update wiki page:', error);
      return createErrorResponse(error.message || ERROR_MESSAGES.FAILED_TO_UPDATE_WIKI);
    }
  }
};

/**
 * Delete Wiki Page tool
 * Deletes a Wiki page from the project
 */
export const deleteWikiPageTool = {
  name: 'deleteWikiPage',
  description: 'Delete a Wiki page from the project (irreversible action)',
  schema: {
    project: z.union([z.number(), z.string()]).describe('Project ID, slug, or name'),
    identifier: z.union([z.number(), z.string()]).describe('Wiki page ID (number) or slug (string)'),
  },
  
  handler: async ({ project, identifier }) => {
    try {
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Resolve project to get project ID
      const resolvedProject = await resolveProjectId(project);
      if (!resolvedProject) {
        return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      // First get the wiki page to get its ID and details if identifier is a slug
      let wikiPageId, wikiSlug;
      if (typeof identifier === 'number') {
        wikiPageId = identifier;
        const wikiPage = await taigaService.getWikiPage(identifier);
        wikiSlug = wikiPage.slug;
      } else {
        const wikiPage = await taigaService.getWikiPageBySlug(identifier, resolvedProject.id);
        wikiPageId = wikiPage.id;
        wikiSlug = wikiPage.slug;
      }

      await taigaService.deleteWikiPage(wikiPageId);
      
      return createSuccessResponse(
        `${SUCCESS_MESSAGES.WIKI_PAGE_DELETED}\n\n` +
        `🗑️ **Wiki頁面刪除成功**\n` +
        `- 已刪除Wiki: ${wikiSlug}\n` +
        `- Wiki ID: ${wikiPageId}\n` +
        `- 專案: ${resolvedProject.name}\n` +
        `- 刪除時間: ${new Date().toLocaleString()}\n\n` +
        `⚠️ 注意：此操作不可逆轉`
      );
    } catch (error) {
      console.error('Failed to delete wiki page:', error);
      return createErrorResponse(error.message || ERROR_MESSAGES.FAILED_TO_DELETE_WIKI);
    }
  }
};

/**
 * Watch Wiki Page tool
 * Watch or unwatch a Wiki page for notifications
 */
export const watchWikiPageTool = {
  name: 'watchWikiPage',
  description: 'Watch or unwatch a Wiki page to receive notifications about changes',
  schema: {
    project: z.union([z.number(), z.string()]).describe('Project ID, slug, or name'),
    identifier: z.union([z.number(), z.string()]).describe('Wiki page ID (number) or slug (string)'),
    watch: z.boolean().default(true).describe('True to watch, false to unwatch the Wiki page'),
  },
  
  handler: async ({ project, identifier, watch }) => {
    try {
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Resolve project to get project ID
      const resolvedProject = await resolveProjectId(project);
      if (!resolvedProject) {
        return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      // First get the wiki page to get its ID if identifier is a slug
      let wikiPageId, wikiSlug;
      if (typeof identifier === 'number') {
        wikiPageId = identifier;
        const wikiPage = await taigaService.getWikiPage(identifier);
        wikiSlug = wikiPage.slug;
      } else {
        const wikiPage = await taigaService.getWikiPageBySlug(identifier, resolvedProject.id);
        wikiPageId = wikiPage.id;
        wikiSlug = wikiPage.slug;
      }

      await taigaService.watchWikiPage(wikiPageId, watch);
      
      const action = watch ? '關注' : '取消關注';
      const actionIcon = watch ? '👁️' : '🚫';
      
      return createSuccessResponse(
        `${SUCCESS_MESSAGES.WIKI_PAGE_WATCHED}\n\n` +
        `${actionIcon} **Wiki頁面${action}成功**\n` +
        `- Wiki: ${wikiSlug}\n` +
        `- Wiki ID: ${wikiPageId}\n` +
        `- 專案: ${resolvedProject.name}\n` +
        `- 操作: ${action}\n` +
        `- 時間: ${new Date().toLocaleString()}\n\n` +
        `${watch ? '🔔 您將收到此Wiki頁面的變更通知' : '🔕 您將不再收到此Wiki頁面的通知'}`
      );
    } catch (error) {
      console.error('Failed to watch/unwatch wiki page:', error);
      return createErrorResponse(error.message || ERROR_MESSAGES.FAILED_TO_WATCH_WIKI);
    }
  }
};