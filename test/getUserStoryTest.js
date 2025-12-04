/**
 * Get User Story Functionality Test
 * Tests the new getUserStory tool (Issue #2 part 2)
 */

import { TaigaService } from '../src/taigaService.js';

const taigaService = new TaigaService();

// Color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

console.log(`\n${colors.blue}╔${'═'.repeat(58)}╗${colors.reset}`);
console.log(`${colors.blue}║${' '.repeat(12)}GET USER STORY FUNCTIONALITY TEST${' '.repeat(12)}║${colors.reset}`);
console.log(`${colors.blue}╚${'═'.repeat(58)}╝${colors.reset}\n`);

async function testGetUserStory() {
  try {
    // Check authentication
    if (!taigaService.isAuthenticated()) {
      console.log(`${colors.red}❌ Not authenticated. Please set TAIGA_USERNAME and TAIGA_PASSWORD environment variables.${colors.reset}\n`);
      process.exit(1);
    }

    console.log(`${colors.green}✓ Authentication configured${colors.reset}\n`);

    // Step 1: Get a project
    console.log(`${colors.blue}Step 1: Getting project...${colors.reset}`);
    const projects = await taigaService.listProjects();

    if (projects.length === 0) {
      console.log(`${colors.red}❌ No projects available for testing${colors.reset}\n`);
      process.exit(1);
    }

    const projectId = projects[0].id;
    console.log(`${colors.green}✓ Project found: ${projects[0].name} (ID: ${projectId})${colors.reset}\n`);

    // Step 2: Get user stories list
    console.log(`${colors.blue}Step 2: Getting user stories list...${colors.reset}`);
    const userStories = await taigaService.listUserStories(projectId);

    if (userStories.length === 0) {
      console.log(`${colors.yellow}⚠ No user stories available for testing${colors.reset}\n`);
      process.exit(0);
    }

    console.log(`${colors.green}✓ Found ${userStories.length} user stories${colors.reset}\n`);

    // Step 3: Test getUserStory with the first user story
    const testStoryId = userStories[0].id;
    const testStoryRef = userStories[0].ref;

    console.log(`${colors.blue}Step 3: Testing getUserStory(${testStoryId})...${colors.reset}`);
    const userStory = await taigaService.getUserStory(testStoryId);

    // Validate response
    const validations = [
      { test: 'Has ID', pass: userStory.id === testStoryId },
      { test: 'Has subject', pass: !!userStory.subject },
      { test: 'Has reference', pass: userStory.ref === testStoryRef },
      { test: 'Has project info', pass: !!userStory.project_extra_info },
      { test: 'Has status info', pass: !!userStory.status_extra_info },
    ];

    let allPassed = true;
    console.log(`\n${colors.blue}Validation Results:${colors.reset}`);
    for (const validation of validations) {
      const status = validation.pass ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
      console.log(`  ${status} ${validation.test}`);
      if (!validation.pass) allPassed = false;
    }

    // Display user story details
    console.log(`\n${colors.blue}Retrieved User Story Details:${colors.reset}`);
    console.log(`  Subject: ${userStory.subject}`);
    console.log(`  Reference: #${userStory.ref}`);
    console.log(`  Project: ${userStory.project_extra_info?.name || 'N/A'}`);
    console.log(`  Status: ${userStory.status_extra_info?.name || 'N/A'}`);
    console.log(`  Epic: ${userStory.epic_extra_info?.subject || 'No Epic'}`);
    console.log(`  Assigned to: ${userStory.assigned_to_extra_info?.full_name || 'Unassigned'}`);
    console.log(`  Sprint: ${userStory.milestone_extra_info?.name || 'No Sprint'}`);
    console.log(`  Points: ${userStory.total_points || 0}`);
    console.log(`  Tasks: ${userStory.tasks?.length || 0}`);

    // Final result
    console.log();
    if (allPassed) {
      console.log(`${colors.green}✨ All tests passed! getUserStory() works correctly.${colors.reset}\n`);
      console.log(`${colors.blue}Issue #2 Part 2: ✅ RESOLVED${colors.reset}`);
      console.log(`${colors.yellow}The /userstories/{id} endpoint is now fully implemented!${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`${colors.red}❌ Some validations failed${colors.reset}\n`);
      process.exit(1);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Test failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run test
testGetUserStory();
