model User {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  role          UserRole  @default(USER)
  isActive      Boolean   @default(true)
  emailVerified Boolean   @default(false)
  lastLoginAt   DateTime?
  
  profile       Profile?
  sessions      Session[]
  teams         TeamMember[]
  ownedTeams    Team[]     @relation("TeamOwner")
  projects      ProjectMember[]
  activities    Activity[]
  
  @@index([email])
  @@index([isActive, role])
  @@map("users")
}

model Profile {
  id          String    @id @default(cuid())
  userId      String    @unique
  bio         String?   @db.Text
  avatarUrl   String?
  phoneNumber String?
  location    String?
  website     String?
  preferences Json?
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("profiles")
}

model Session {
  id          String    @id @default(cuid())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  expiresAt   DateTime
  token       String    @unique
  ipAddress   String?
  userAgent   String?
  userId      String
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

model Team {
  id          String    @id @default(cuid())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  name        String
  slug        String    @unique
  description String?   @db.Text
  isPrivate   Boolean   @default(false)
  ownerId     String
  
  owner       User      @relation("TeamOwner", fields: [ownerId], references: [id])
  members     TeamMember[]
  projects    Project[]
  
  @@index([ownerId])
  @@index([slug])
  @@map("teams")
}

model TeamMember {
  id        String     @id @default(cuid())
  teamId    String
  userId    String
  role      MemberRole @default(MEMBER)
  joinedAt  DateTime   @default(now())
  
  team      Team       @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([teamId, userId])
  @@index([teamId, role])
  @@map("team_members")
}

model Project {
  id          String    @id @default(cuid())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  name        String
  description String?   @db.Text
  status      ProjectStatus @default(ACTIVE)
  teamId      String
  
  team        Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)
  members     ProjectMember[]
  tasks       Task[]
  
  @@index([teamId, status])
  @@map("projects")
}

model ProjectMember {
  id        String     @id @default(cuid())
  projectId String
  userId    String
  role      MemberRole @default(MEMBER)
  joinedAt  DateTime   @default(now())
  
  project   Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([projectId, userId])
  @@index([projectId, role])
  @@map("project_members")
}

model Task {
  id          String      @id @default(cuid())
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  title       String
  description String?     @db.Text
  status      TaskStatus  @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  projectId   String
  assigneeId  String?
  
  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee    User?       @relation(fields: [assigneeId], references: [id], onDelete: SetNull)
  comments    Comment[]
  activities  Activity[]
  
  @@index([projectId, status])
  @@index([assigneeId])
  @@index([dueDate])
  @@map("tasks")
}

model Comment {
  id        String    @id @default(cuid())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  content   String    @db.Text
  taskId    String
  authorId  String
  
  task      Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  @@index([taskId])
  @@index([authorId])
  @@map("comments")
}

model Activity {
  id          String        @id @default(cuid())
  createdAt   DateTime      @default(now())
  entityType  EntityType
  entityId    String
  action      ActivityAction
  metadata    Json?
  userId      String
  taskId      String?
  
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  task        Task?         @relation(fields: [taskId], references: [id], onDelete: SetNull)
  
  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
  @@map("activities")
}

enum UserRole {
  USER
  ADMIN
  SYSTEM
}

enum MemberRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
  COMPLETED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum EntityType {
  USER
  TEAM
  PROJECT
  TASK
  COMMENT
}

enum ActivityAction {
  CREATED
  UPDATED
  DELETED
  COMPLETED
  ASSIGNED
  COMMENTED
  JOINED
  LEFT
}

// prisma/schema.prisma remains the same as in the previous example

// src/services/projectService.ts
import { PrismaClient, MemberRole, ProjectStatus, TaskStatus } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface ProjectCreateInput {
  name: string;
  description?: string;
  teamId: string;
  initialMembers?: Array<{
    userId: string;
    role: MemberRole;
  }>;
}

interface ProjectUpdateInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

interface ProjectSearchParams {
  query?: string;
  teamId?: string;
  status?: ProjectStatus[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Create a new project with initial members
 */
export async function createProject(data: ProjectCreateInput, currentUserId: string) {
  logger.info(`Creating new project for team ${data.teamId}`);

  return await prisma.$transaction(async (tx) => {
    // Check if user is a member of the team with proper permissions
    const teamMembership = await tx.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: data.teamId,
          userId: currentUserId,
        },
      },
    });

    if (!teamMembership) {
      throw new ForbiddenError('You are not a member of this team');
    }

    if (![MemberRole.OWNER, MemberRole.ADMIN].includes(teamMembership.role)) {
      throw new ForbiddenError('You do not have permission to create projects');
    }

    // Create the project
    const project = await tx.project.create({
      data: {
        name: data.name,
        description: data.description,
        teamId: data.teamId,
      },
    });

    // Add the creator as project owner
    await tx.projectMember.create({
      data: {
        projectId: project.id,
        userId: currentUserId,
        role: MemberRole.OWNER,
      },
    });

    // Add initial members if provided
    if (data.initialMembers && data.initialMembers.length > 0) {
      await tx.projectMember.createMany({
        data: data.initialMembers.map(member => ({
          projectId: project.id,
          userId: member.userId,
          role: member.role,
        })),
        skipDuplicates: true,
      });
    }

    // Record activity
    await tx.activity.create({
      data: {
        entityType: 'PROJECT',
        entityId: project.id,
        action: 'CREATED',
        userId: currentUserId,
        metadata: { projectName: project.name },
      },
    });

    return project;
  });
}

/**
 * Get project details with members, tasks statistics and recent activities
 */
export async function getProjectDetails(projectId: string, currentUserId: string) {
  logger.info(`Fetching project details for ${projectId}`);

  // Check if user has access to the project
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: currentUserId,
      },
    },
  });

  if (!membership) {
    // Check if the user is part of the team that owns the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { teamId: true },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const teamMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: project.teamId,
          userId: currentUserId,
        },
      },
    });

    if (!teamMembership) {
      throw new ForbiddenError('You do not have access to this project');
    }
  }

  // Get comprehensive project details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profile: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          joinedAt: 'desc',
        },
      },
    },
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Get task statistics
  const taskStats = await prisma.$queryRaw`
    SELECT 
      status, 
      COUNT(*) as count
    FROM tasks
    WHERE "projectId" = ${projectId}
    GROUP BY status
  `;

  // Get recent activities
  const recentActivities = await prisma.activity.findMany({
    where: {
      OR: [
        { entityType: 'PROJECT', entityId: projectId },
        { task: { projectId } },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profile: {
            select: {
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  return {
    ...project,
    taskStats,
    recentActivities,
  };
}

/**
 * Update project details
 */
export async function updateProject(
  projectId: string,
  data: ProjectUpdateInput,
  currentUserId: string
) {
  logger.info(`Updating project ${projectId}`);
  
  return await prisma.$transaction(async (tx) => {
    // Check if user has proper permissions
    const membership = await tx.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: currentUserId,
        },
      },
    });

    if (!membership || ![MemberRole.OWNER, MemberRole.ADMIN].includes(membership.role)) {
      throw new ForbiddenError('You do not have permission to update this project');
    }

    const project = await tx.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        updatedAt: new Date(),
      },
    });

    // Record activity
    await tx.activity.create({
      data: {
        entityType: 'PROJECT',
        entityId: project.id,
        action: 'UPDATED',
        userId: currentUserId,
        metadata: { 
          updatedFields: Object.keys(data),
          projectName: project.name 
        },
      },
    });

    return project;
  });
}

/**
 * Search and filter projects with pagination
 */
export async function searchProjects(params: ProjectSearchParams, currentUserId: string) {
  logger.info(`Searching projects with params: ${JSON.stringify(params)}`);
  
  const {
    query,
    teamId,
    status,
    page = 1,
    limit = 10,
    sortBy = 'updatedAt',
    sortDirection = 'desc'
  } = params;

  // Get teams the user is a member of
  const userTeams = await prisma.teamMember.findMany({
    where: { userId: currentUserId },
    select: { teamId: true },
  });

  const teamIds = userTeams.map(t => t.teamId);

  // Basic user check
  if (teamId && !teamIds.includes(teamId)) {
    throw new ForbiddenError('You do not have access to this team');
  }

  // Build where clause
  const where = {
    AND: [
      // Only projects from teams the user is a member of
      { teamId: teamId ? teamId : { in: teamIds } },
      // Status filter
      status && status.length > 0 ? { status: { in: status } } : {},
      // Text search
      query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      } : {},
    ],
  };

  // Count total matching projects
  const totalCount = await prisma.project.count({ where });

  // Get paginated results
  const projects = await prisma.project.findMany({
    where,
    orderBy: {
      [sortBy]: sortDirection,
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          tasks: true,
          members: true,
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Get task completion stats for each project
  const projectIds = projects.map(p => p.id);
  const taskStats = await prisma.task.groupBy({
    by: ['projectId', 'status'],
    where: {
      projectId: { in: projectIds },
    },
    _count: {
      id: true,
    },
  });

  // Process and return results
  const enhancedProjects = projects.map(project => {
    const projectTaskStats = taskStats.filter(t => t.projectId === project.id);
    const completedTasks = projectTaskStats.find(t => t.status === TaskStatus.DONE)?._count?.id || 0;
    const totalTasks = projectTaskStats.reduce((acc, curr) => acc + curr._count.id, 0);
    
    return {
      ...project,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  });

  return {
    projects: enhancedProjects,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit),
    },
  };
}

/**
 * Archive a project (soft delete)
 */
export async function archiveProject(projectId: string, currentUserId: string) {
  logger.info(`Archiving project ${projectId}`);
  
  return await prisma.$transaction(async (tx) => {
    // Check permissions
    const membership = await tx.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: currentUserId,
        },
      },
    });
    
    const project = await tx.project.findUnique({
      where: { id: projectId },
      select: { teamId: true, name: true },
    });
    
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    
    // Also check team ownership
    const teamMembership = await tx.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: project.teamId,
          userId: currentUserId,
        },
      },
    });
    
    const canArchive = 
      (membership && membership.role === MemberRole.OWNER) || 
      (teamMembership && teamMembership.role === MemberRole.OWNER);
    
    if (!canArchive) {
      throw new ForbiddenError('Only project or team owners can archive projects');
    }
    
    // Archive the project
    const updatedProject = await tx.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.ARCHIVED,
        updatedAt: new Date(),
      },
    });
    
    // Record activity
    await tx.activity.create({
      data: {
        entityType: 'PROJECT',
        entityId: projectId,
        action: 'UPDATED',
        userId: currentUserId,
        metadata: { 
          action: 'archived',
          projectName: project.name
        },
      },
    });
    
    return updatedProject;
  });
}

// User service example with authentication functionality
// src/services/userService.ts
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { InvalidCredentialsError } from '../utils/errors';

const prisma = new PrismaClient();

interface UserRegistrationData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface LoginData {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Register a new user
 */
export async function registerUser(data: UserRegistrationData) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 12);

  // Create user and profile in transaction
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        profile: {
          create: {},
        },
      },
      include: {
        profile: true,
      },
    });

    // Exclude password hash from returned data
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  });
}

/**
 * Authenticate user and create session
 */
export async function loginUser(data: LoginData) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new InvalidCredentialsError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  
  if (!isPasswordValid) {
    throw new InvalidCredentialsError('Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new Error('Your account has been deactivated');
  }

  // Create session token (secure random token)
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Create session
  const session = await prisma.session.create({
    data: {
      token,
      expiresAt,
      userId: user.id,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });

  // Update last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    token: session.token,
    expiresAt: session.expiresAt,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
}

/**
 * Validate session token and get user
 */
export async function validateSession(token: string) {
  // Find valid session
  const session = await prisma.session.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (!session || !session.user.isActive) {
    return null;
  }

  return session.user;
}

/**
 * Log out user by invalidating session
 */
export async function logoutUser(token: string) {
  await prisma.session.deleteMany({
    where: { token },
  });
  
  return true;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
    phoneNumber?: string;
    location?: string;
    website?: string;
    preferences?: Record<string, any>;
  }
) {
  const { firstName, lastName, ...profileData } = data;
  
  return await prisma.$transaction(async (tx) => {
    // Update user basic info
    if (firstName !== undefined || lastName !== undefined) {
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName: firstName !== undefined ? firstName : undefined,
          lastName: lastName !== undefined ? lastName : undefined,
        },
      });
    }
    
    // Update profile
    const profile = await tx.profile.update({
      where: { userId },
      data: profileData,
    });
    
    // Get updated user with profile
    const updatedUser = await tx.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });
    
    // Remove sensitive fields
    const { passwordHash, ...userWithoutPassword } = updatedUser!;
    return userWithoutPassword;
  });
}

// Task service with examples of more complex usage of Prisma
// src/services/taskService.ts
import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

interface TaskCreateInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  projectId: string;
  assigneeId?: string;
}

interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  assigneeId?: string | null;
}

interface TaskSearchParams {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  dueBefore?: Date;
  dueAfter?: Date;
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Check if user has access to the project
 */
async function checkProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true },
  });
  
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  
  // Check project membership
  const projectMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
  
  if (projectMember) {
    return true;
  }
  
  // Check team membership as fallback
  const teamMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: project.teamId,
        userId,
      },
    },
  });
  
  if (!teamMember) {
    throw new ForbiddenError('You do not have access to this project');
  }
  
  return true;
}

/**
 * Create a new task in a project
 */
export async function createTask(data: TaskCreateInput, currentUserId: string) {
  await checkProjectAccess(data.projectId, currentUserId);
  
  return await prisma.$transaction(async (tx) => {
    // Create the task
    const task = await tx.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || TaskStatus.TODO,
        priority: data.priority || TaskPriority.MEDIUM,
        dueDate: data.dueDate,
        projectId: data.projectId,
        assigneeId: data.assigneeId,
      },
    });
    
    // Record activity
    await tx.activity.create({
      data: {
        entityType: 'TASK',
        entityId: task.id,
        action: 'CREATED',
        userId: currentUserId,
        taskId: task.id,
        metadata: { 
          taskTitle: task.title,
          assigneeId: task.assigneeId
        },
      },
    });
    
    return task;
  });
}

/**
 * Get task details with related data
 */
export async function getTaskDetails(taskId: string, currentUserId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          teamId: true,
        },
      },
      assignee: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          profile: {
            select: {
              avatarUrl: true,
            },
          },
        },
      },
    },
  });
  
  if (!task) {
    throw new NotFoundError('Task not found');
    
  }
  
  await checkProjectAccess(task.projectId, currentUserId);
  
  // Get comments
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profile: {
            select: {
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
  
  // Get activities
  const activities = await prisma.activity.findMany({
    where: { taskId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profile: {
            select: {
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  return {
    ...task,
    comments,
    activities,
  };
}

/**
 * Update task details
 */
export async function updateTask(
  taskId: string,
  data: TaskUpdateInput,
  currentUserId: string
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, title: true, status: true, assigneeId: true },
  });
  
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  await checkProjectAccess(task.projectId, currentUserId);
  
  return await prisma.$transaction(async (tx) => {
    // Record status change specific activity if applicable
    if (data.status && data.status !== task.status) {
      await tx.activity.create({
        data: {
          entityType: 'TASK',
          entityId: taskId,
          action: data.status === TaskStatus.DONE ? 'COMPLETED' : 'UPDATED',
          userId: currentUserId,
          taskId,
          metadata: { 
            previousStatus: task.status,
            newStatus: data.status
          },
        },
      });
    }
    
    // Record assignee change specific activity if applicable
    if (data.assigneeId !== undefined && data.assigneeId !== task.assigneeId) {
      await tx.activity.create({
        data: {
          entityType: 'TASK',
          entityId: taskId,
          action: 'ASSIGNED',
          userId: currentUserId,
          taskId,
          metadata: { 
            previousAssigneeId: task.assigneeId,
            newAssigneeId: data.assigneeId 
          },
        },
      });
    }
    
    // Update the task
    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate,
        assigneeId: data.assigneeId,
        updatedAt: new Date(),
      },
    });
    
    return updatedTask;
  });
}

/**
 * Add comment to a task
 */
export async function addTaskComment(
  taskId: string,
  content: string,
  currentUserId: string
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, title: true },
  });
  
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  await checkProjectAccess(task.projectId, currentUserId);
  
  return await prisma.$transaction(async (tx) => {
    // Create comment
    const comment = await tx.comment.create({
      data: {
        content,
        taskId,
        authorId: currentUserId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    
    // Record activity
    await tx.activity.create({
      data: {
        entityType: 'TASK',
        entityId: taskId,
        action: 'COMMENTED',
        userId: currentUserId,
        taskId,
        metadata: { 
          commentId: comment.id
        },
      },
    });
    
    return comment;
  });
}

/**
 * Search and filter tasks with pagination
 */
export async function searchTasks(params: TaskSearchParams, currentUserId: string) {
  const {
    projectId,
    assigneeId,
    status,
    priority,
    dueBefore,
    dueAfter,
    query,
    page = 1,
    limit = 20,
    sortBy = 'updatedAt',
    sortDirection = 'desc'
  } = params;
  
  // If projectId is provided, verify access
  if (projectId) {
    await checkProjectAccess(projectId, currentUserId);
  }
  
  // Get projects the user has access to
  const accessibleProjects = await getAccessibleProjects(currentUserId);
  
  // Build where clause
  const where = {
    AND: [
      // Filter by projects user has access to
      projectId 
        ? { projectId } 
        : { projectId: { in: accessibleProjects } },
      
      // Filter by assignee
      assigneeId ? { assigneeId } : {},
      
      // Filter by status
      status && status.length > 0 ? { status: { in: status } } : {},
      
      // Filter by priority
      priority && priority.length > 0 ? { priority: { in: priority } } : {},
      
      // Filter by due date range
      dueBefore || dueAfter ? {
        dueDate: {
          ...(dueBefore ? { lte: dueBefore } : {}),
          ...(dueAfter ? { gte: dueAfter } : {}),
        }
      } : {},
      
      // Text search in title and description
      query ? {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      } : {},
    ],
  };
  
  // Count total matching tasks
  const totalCount = await prisma.task.count({ where });
  
  // Get paginated results
  const tasks = await prisma.task.findMany({
    where,
    orderBy: {
      [sortBy]: sortDirection,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profile: {
            select: {
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
  });
  
  return {
    tasks,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit),
    },
  };
}

/**
 * Get all project IDs that the user has access to
 */
async function getAccessibleProjects(userId: string): Promise<string[]> {
  // Get teams the user is a member of
  const userTeams = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });
  
  const teamIds = userTeams.map(t => t.teamId);
  
  // Get projects from user's teams
  const teamProjects = await prisma.project.findMany({
    where: { teamId: { in: teamIds } },
    select: { id: true },
  });
  
  // Get projects where user is directly a member
  const directProjects = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  
  // Combine and deduplicate
  const projectIds = new Set([
    ...teamProjects.map(p => p.id),
    ...directProjects.map(p => p.projectId),
  ]);
  
  return Array.from(projectIds);
}

// Example of usage in an API route handler
// src/api/tasks.ts (Express.js example)
/*
import express from 'express';
import { createTask, getTaskDetails, updateTask, searchTasks } from '../services/taskService';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Create a new task
router.post('/', authenticate, async (req, res, next) => {
  try {
    const task = await createTask(req.body, req.user.id);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// Get task details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const task = await getTaskDetails(req.params.id, req.user.id);
    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Update task
router.patch('/:id', authenticate, async (req, res, next