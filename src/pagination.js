/**
 * Pagination utilities for Taiga API
 * Separated to avoid circular dependencies
 */

/**
 * Fetch all paginated results from Taiga API
 * Handles both paginated responses (with next/previous links) and non-paginated arrays
 * @param {Function} fetchFunction - Async function that fetches a page of data
 * @param {Object} initialParams - Initial query parameters
 * @param {number} maxPages - Maximum number of pages to fetch (default: 100, safety limit)
 * @returns {Promise<Array>} - Complete array of all items across all pages
 */
export async function fetchAllPaginated(fetchFunction, initialParams = {}, maxPages = 100) {
  let allItems = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore && currentPage <= maxPages) {
    try {
      // Fetch current page
      const params = {
        ...initialParams,
        page: currentPage
      };

      const response = await fetchFunction(params);

      // Handle different response formats
      let items = [];
      let nextUrl = null;

      if (response.data) {
        // Check if response has pagination metadata
        if (Array.isArray(response.data)) {
          // Simple array response (non-paginated or already processed)
          items = response.data;
          hasMore = false; // No pagination info, assume single page
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // Paginated response with results array
          items = response.data.results;
          nextUrl = response.data.next;
          hasMore = !!nextUrl;
        } else {
          // Unexpected format, treat as single item or empty
          items = response.data.results || [];
          hasMore = false;
        }
      } else {
        // Response itself is the data
        items = Array.isArray(response) ? response : [];
        hasMore = false;
      }

      // Add items to result
      allItems = allItems.concat(items);

      // Check if we should continue
      if (!hasMore || items.length === 0) {
        break;
      }

      currentPage++;
    } catch (error) {
      // If pagination fails, return what we have so far
      console.warn(`Pagination stopped at page ${currentPage}: ${error.message}`);
      break;
    }
  }

  if (currentPage > maxPages) {
    console.warn(`Reached maximum page limit (${maxPages}). Results may be incomplete.`);
  }

  return allItems;
}
