import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';

@ApiTags('projects')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project owned by the current user' })
  @ApiCreatedResponse({
    description: 'Project created',
    type: ProjectResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List your projects',
    description:
      "Scoped to the authenticated user at the query level, so another user's projects are never returned.",
  })
  @ApiOkResponse({
    description: 'Projects owned by the current user, newest first',
    type: [ProjectResponseDto],
  })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.projectsService.findAllForUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single project' })
  @ApiOkResponse({ description: 'The project', type: ProjectResponseDto })
  @ApiForbiddenResponse({ description: 'Not the owner, and not an admin' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.findOneForUser(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiOkResponse({ description: 'Project updated', type: ProjectResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiForbiddenResponse({ description: 'Not the owner, and not an admin' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, user, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a project',
    description:
      'Deleting a project cascades to its issues. Restricted to the project owner or an admin.',
  })
  @ApiNoContentResponse({ description: 'Project deleted' })
  @ApiForbiddenResponse({ description: 'Not the owner, and not an admin' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.remove(id, user);
  }
}
