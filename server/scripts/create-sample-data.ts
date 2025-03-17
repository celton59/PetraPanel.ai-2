import { db } from '@db';
import { 
  projects, videos, youtube_channels, actionRates,
  affiliateCompanies, users
} from '@db/schema';

async function createSampleData() {
  try {
    // Create sample projects
    const projectsData = await db.insert(projects).values([
      {
        name: "Gaming Channel",
        prefix: "GAME",
        description: "Video game reviews and gameplay",
        current_number: 0
      },
      {
        name: "Tech Reviews",
        prefix: "TECH",
        description: "Technology product reviews",
        current_number: 0
      },
      {
        name: "Cooking Show",
        prefix: "COOK",
        description: "Recipes and cooking tutorials",
        current_number: 0
      }
    ]).returning();

    console.log('Created sample projects:', projectsData);

    // Create sample videos
    const videosData = await db.insert(videos).values([
      {
        projectId: projectsData[0].id,
        title: "Top 10 Games of 2025",
        description: "A comprehensive review of this year's best games",
        status: "available",
        tags: "gaming,reviews,top10",
        seriesNumber: "GAME001"
      },
      {
        projectId: projectsData[1].id,
        title: "iPhone 16 Pro Review",
        description: "Complete review of the latest iPhone",
        status: "content_review",
        tags: "tech,apple,review",
        seriesNumber: "TECH001"
      },
      {
        projectId: projectsData[2].id,
        title: "Easy Pasta Recipes",
        description: "Three quick pasta dishes for beginners",
        status: "completed",
        tags: "cooking,pasta,beginner",
        seriesNumber: "COOK001"
      }
    ]).returning();

    console.log('Created sample videos:', videosData);

    // Create sample YouTube channels
    const channelsData = await db.insert(youtube_channels).values([
      {
        channelId: "UC123456789",
        name: "GameMaster Pro",
        url: "https://youtube.com/gamemasterpro",
        description: "Professional gaming channel",
        subscriberCount: 100000,
        videoCount: 500,
        active: true
      },
      {
        channelId: "UC987654321",
        name: "TechReviewer",
        url: "https://youtube.com/techreviewer",
        description: "Latest tech reviews and news",
        subscriberCount: 250000,
        videoCount: 300,
        active: true
      }
    ]).returning();

    console.log('Created sample YouTube channels:', channelsData);

    // Create sample action rates with correct role types
    const actionRatesData = await db.insert(actionRates).values([
      {
        actionType: "content_optimization",
        roleId: "optimizer",
        rate: "20.00",
        isActive: true
      },
      {
        actionType: "content_review",
        roleId: "content_reviewer",
        rate: "15.00",
        isActive: true
      },
      {
        actionType: "media_review",
        roleId: "media_reviewer",
        rate: "25.00",
        isActive: true
      }
    ]).returning();

    console.log('Created sample action rates:', actionRatesData);

    // Create sample affiliate companies
    const affiliateCompaniesData = await db.insert(affiliateCompanies).values([
      {
        name: "Gaming Gear Pro",
        description: "Gaming peripherals and accessories",
        affiliate_url: "https://gaminggear.com/ref=123",
        keywords: ["gaming", "peripherals", "accessories"],
        active: true
      },
      {
        name: "TechStore",
        description: "Electronics and gadgets",
        affiliate_url: "https://techstore.com/ref=456",
        keywords: ["electronics", "gadgets", "tech"],
        active: true
      }
    ]).returning();

    console.log('Created sample affiliate companies:', affiliateCompaniesData);

    // Create additional users with different roles
    const usersData = await db.insert(users).values([
      {
        username: "reviewer1",
        password: "$2b$10$dfc3f3fd3e7d3a4b3c2a1b0c9d8e7f6g5h4i3j2k1l0m9n8o7p6q5r4s3",
        role: "content_reviewer",
        fullName: "John Reviewer",
        email: "john@example.com"
      },
      {
        username: "optimizer1",
        password: "$2b$10$dfc3f3fd3e7d3a4b3c2a1b0c9d8e7f6g5h4i3j2k1l0m9n8o7p6q5r4s3",
        role: "optimizer",
        fullName: "Jane Optimizer",
        email: "jane@example.com"
      },
      {
        username: "youtuber1",
        password: "$2b$10$dfc3f3fd3e7d3a4b3c2a1b0c9d8e7f6g5h4i3j2k1l0m9n8o7p6q5r4s3",
        role: "youtuber",
        fullName: "Bob Creator",
        email: "bob@example.com"
      }
    ]).returning();

    console.log('Created sample users:', usersData);

    console.log('All sample data created successfully!');
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

// Execute the function
createSampleData();