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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { QueryIssuesDto } from './dto/query-issues.dto';
import { IssueResponseDto, PaginatedIssuesDto } from './dto/issue-response.dto';

@ApiTags('issues')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an issue in a project' })
  @ApiCreatedResponse({ description: 'Issue created', type: IssueResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({
    description: 'Project not found, or assignee not found',
  })
  create(@Param('projectId') projectId: string, @Body() dto: CreateIssueDto) {
    return this.issuesService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List issues in a project',
    description:
      'Supports filtering by status and priority, and pagination via page and limit. Filtering and paging are applied in the database rather than in memory.',
  })
  @ApiOkResponse({
    description: 'A page of issues, plus pagination metadata',
    type: PaginatedIssuesDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid query parameters (unknown status/priority, or non-numeric page/limit)',
  })
  @ApiNotFoundResponse({ description: 'Project not found' })
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: QueryIssuesDto,
  ) {
    return this.issuesService.findAll(projectId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single issue',
    description:
      'The issue must belong to the project in the URL, so an issue id from another project returns 404 rather than leaking it.',
  })
  @ApiOkResponse({ description: 'The issue', type: IssueResponseDto })
  @ApiNotFoundResponse({ description: 'Issue not found in this project' })
  findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.issuesService.findOne(projectId, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an issue (status, priority, assignee, ...)',
  })
  @ApiOkResponse({ description: 'Issue updated', type: IssueResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({
    description: 'Issue not found in this project, or assignee not found',
  })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateIssueDto,
  ) {
    return this.issuesService.update(projectId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an issue' })
  @ApiNoContentResponse({ description: 'Issue deleted' })
  @ApiNotFoundResponse({ description: 'Issue not found in this project' })
  remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.issuesService.remove(projectId, id);
  }
}
