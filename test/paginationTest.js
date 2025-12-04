/**
 * Pagination Functionality Tests
 * Tests the pagination support for all list operations
 */

import { TaigaService } from '../src/taigaService.js';
import { fetchAllPaginated } from '../src/pagination.js';

const taigaService = new TaigaService();

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Test results tracker
let passedTests = 0;
let failedTests = 0;
let totalTests = 0;

/**
 * Print test result
 */
function printResult(testName, passed, message = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
  } else {
    failedTests++;
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (message) {
      console.log(`  ${colors.red}Error: ${message}${colors.reset}`);
    }
  }
}

/**
 * Print section header
 */
function printSection(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

/**
 * Test 1: fetchAllPaginated utility function with mock data
 */
async function testFetchAllPaginatedUtility() {
  printSection('Test 1: fetchAllPaginated Utility Function');

  try {
    // Mock paginated response
    let callCount = 0;
    const mockFetchFunction = async (params) => {
      callCount++;
      const page = params.page || 1;

      if (page === 1) {
        return {
          data: {
            results: [{ id: 1 }, { id: 2 }, { id: 3 }],
            next: 'page2',
            count: 7
          }
        };
      } else if (page === 2) {
        return {
          data: {
            results: [{ id: 4 }, { id: 5 }, { id: 6 }],
            next: 'page3',
            count: 7
          }
        };
      } else if (page === 3) {
        return {
          data: {
            results: [{ id: 7 }],
            next: null,
            count: 7
          }
        };
      }
    };

    const result = await fetchAllPaginated(mockFetchFunction, {});

    printResult(
      'Mock paginated fetch returns all items',
      result.length === 7 && callCount === 3,
      result.length !== 7 ? `Expected 7 items, got ${result.length}` : `Expected 3 calls, got ${callCount}`
    );

  } catch (error) {
    printResult('Mock paginated fetch', false, error.message);
  }
}

/**
 * Test 2: fetchAllPaginated with non-paginated array response
 */
async function testFetchAllPaginatedNonPaginated() {
  printSection('Test 2: Non-Paginated Array Response');

  try {
    const mockFetchFunction = async () => {
      return {
        data: [{ id: 1 }, { id: 2 }, { id: 3 }]
      };
    };

    const result = await fetchAllPaginated(mockFetchFunction, {});

    printResult(
      'Non-paginated array response handled correctly',
      result.length === 3,
      `Expected 3 items, got ${result.length}`
    );

  } catch (error) {
    printResult('Non-paginated array response', false, error.message);
  }
}

/**
 * Test 3: fetchAllPaginated with max page limit
 */
async function testFetchAllPaginatedMaxLimit() {
  printSection('Test 3: Max Page Limit Safety');

  try {
    let callCount = 0;
    const mockFetchFunction = async (params) => {
      callCount++;
      return {
        data: {
          results: [{ id: callCount }],
          next: 'always_has_next', // Infinite pagination
          count: 999
        }
      };
    };

    const result = await fetchAllPaginated(mockFetchFunction, {}, 5);

    printResult(
      'Max page limit prevents infinite loops',
      callCount === 5 && result.length === 5,
      `Expected 5 calls and items, got ${callCount} calls and ${result.length} items`
    );

  } catch (error) {
    printResult('Max page limit', false, error.message);
  }
}

/**
 * Test 4: Real API - List projects with pagination
 */
async function testListProjectsPagination() {
  printSection('Test 4: Real API - List Projects Pagination');

  try {
    const projects = await taigaService.listProjects();

    printResult(
      'List projects returns array',
      Array.isArray(projects),
      'Result is not an array'
    );

    console.log(`  ${colors.yellow}→ Found ${projects.length} project(s)${colors.reset}`);

  } catch (error) {
    printResult('List projects pagination', false, error.message);
  }
}

/**
 * Test 5: Real API - List user stories with pagination
 */
async function testListUserStoriesPagination() {
  printSection('Test 5: Real API - List User Stories Pagination');

  try {
    // First get a project
    const projects = await taigaService.listProjects();

    if (projects.length === 0) {
      printResult('List user stories pagination', false, 'No projects available for testing');
      return;
    }

    const projectId = projects[0].id;
    const userStories = await taigaService.listUserStories(projectId);

    printResult(
      'List user stories returns array',
      Array.isArray(userStories),
      'Result is not an array'
    );

    console.log(`  ${colors.yellow}→ Found ${userStories.length} user stor(y/ies) in project "${projects[0].name}"${colors.reset}`);

  } catch (error) {
    printResult('List user stories pagination', false, error.message);
  }
}

/**
 * Test 6: Real API - List issues with pagination
 */
async function testListIssuesPagination() {
  printSection('Test 6: Real API - List Issues Pagination');

  try {
    const projects = await taigaService.listProjects();

    if (projects.length === 0) {
      printResult('List issues pagination', false, 'No projects available for testing');
      return;
    }

    const projectId = projects[0].id;
    const issues = await taigaService.listIssues(projectId);

    printResult(
      'List issues returns array',
      Array.isArray(issues),
      'Result is not an array'
    );

    console.log(`  ${colors.yellow}→ Found ${issues.length} issue(s) in project "${projects[0].name}"${colors.reset}`);

  } catch (error) {
    printResult('List issues pagination', false, error.message);
  }
}

/**
 * Test 7: Real API - List milestones with pagination
 */
async function testListMilestonesPagination() {
  printSection('Test 7: Real API - List Milestones Pagination');

  try {
    const projects = await taigaService.listProjects();

    if (projects.length === 0) {
      printResult('List milestones pagination', false, 'No projects available for testing');
      return;
    }

    const projectId = projects[0].id;
    const milestones = await taigaService.listMilestones(projectId);

    printResult(
      'List milestones returns array',
      Array.isArray(milestones),
      'Result is not an array'
    );

    console.log(`  ${colors.yellow}→ Found ${milestones.length} milestone(s) in project "${projects[0].name}"${colors.reset}`);

  } catch (error) {
    printResult('List milestones pagination', false, error.message);
  }
}

/**
 * Test 8: Real API - List epics with pagination
 */
async function testListEpicsPagination() {
  printSection('Test 8: Real API - List Epics Pagination');

  try {
    const projects = await taigaService.listProjects();

    if (projects.length === 0) {
      printResult('List epics pagination', false, 'No projects available for testing');
      return;
    }

    const projectId = projects[0].id;
    const epics = await taigaService.listEpics(projectId);

    printResult(
      'List epics returns array',
      Array.isArray(epics),
      'Result is not an array'
    );

    console.log(`  ${colors.yellow}→ Found ${epics.length} epic(s) in project "${projects[0].name}"${colors.reset}`);

  } catch (error) {
    printResult('List epics pagination', false, error.message);
  }
}

/**
 * Test 9: Real API - List wiki pages with pagination
 */
async function testListWikiPagesPagination() {
  printSection('Test 9: Real API - List Wiki Pages Pagination');

  try {
    const projects = await taigaService.listProjects();

    if (projects.length === 0) {
      printResult('List wiki pages pagination', false, 'No projects available for testing');
      return;
    }

    const projectId = projects[0].id;
    const wikiPages = await taigaService.listWikiPages(projectId);

    printResult(
      'List wiki pages returns array',
      Array.isArray(wikiPages),
      'Result is not an array'
    );

    console.log(`  ${colors.yellow}→ Found ${wikiPages.length} wiki page(s) in project "${projects[0].name}"${colors.reset}`);

  } catch (error) {
    printResult('List wiki pages pagination', false, error.message);
  }
}

/**
 * Test 10: Real API - Get issues by milestone with pagination
 */
async function testGetIssuesByMilestonePagination() {
  printSection('Test 10: Real API - Get Issues by Milestone Pagination');

  try {
    const projects = await taigaService.listProjects();

    if (projects.length === 0) {
      printResult('Get issues by milestone pagination', false, 'No projects available for testing');
      return;
    }

    const projectId = projects[0].id;
    const milestones = await taigaService.listMilestones(projectId);

    if (milestones.length === 0) {
      console.log(`  ${colors.yellow}⚠ No milestones available for testing${colors.reset}`);
      printResult('Get issues by milestone pagination (skipped)', true, 'No milestones available');
      return;
    }

    const milestoneId = milestones[0].id;
    const issues = await taigaService.getIssuesByMilestone(projectId, milestoneId);

    printResult(
      'Get issues by milestone returns array',
      Array.isArray(issues),
      'Result is not an array'
    );

    console.log(`  ${colors.yellow}→ Found ${issues.length} issue(s) in milestone "${milestones[0].name}"${colors.reset}`);

  } catch (error) {
    printResult('Get issues by milestone pagination', false, error.message);
  }
}

/**
 * Main test runner
 */
async function runPaginationTests() {
  console.log(`\n${colors.blue}╔${'═'.repeat(58)}╗${colors.reset}`);
  console.log(`${colors.blue}║${' '.repeat(10)}TAIGA MCP PAGINATION TEST SUITE${' '.repeat(15)}║${colors.reset}`);
  console.log(`${colors.blue}╚${'═'.repeat(58)}╝${colors.reset}\n`);

  // Check authentication
  if (!taigaService.isAuthenticated()) {
    console.log(`${colors.red}❌ Not authenticated. Please set TAIGA_USERNAME and TAIGA_PASSWORD environment variables.${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`${colors.green}✓ Authentication configured${colors.reset}\n`);

  // Run utility tests (no API calls)
  await testFetchAllPaginatedUtility();
  await testFetchAllPaginatedNonPaginated();
  await testFetchAllPaginatedMaxLimit();

  // Run real API tests
  await testListProjectsPagination();
  await testListUserStoriesPagination();
  await testListIssuesPagination();
  await testListMilestonesPagination();
  await testListEpicsPagination();
  await testListWikiPagesPagination();
  await testGetIssuesByMilestonePagination();

  // Print summary
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  if (failedTests === 0) {
    console.log(`${colors.green}✨ All pagination tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Some pagination tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPaginationTests().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}

export { runPaginationTests };
