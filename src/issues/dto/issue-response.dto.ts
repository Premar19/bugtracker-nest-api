import { ApiProperty } from '@nestjs/swagger';
import { IssuePriority, IssueStatus } from '../../../generated/prisma/enums';

export class IssueResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Login button does nothing on Safari' })
  title!: string;

  @ApiProperty({ nullable: true, example: 'Reproduced on Safari 17.' })
  description!: string | null;

  @ApiProperty({ enum: IssueStatus, example: IssueStatus.OPEN })
  status!: IssueStatus;

  @ApiProperty({ enum: IssuePriority, example: IssuePriority.HIGH })
  priority!: IssuePriority;

  @ApiProperty({ format: 'uuid' })
  projectId!: string;

  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description: 'Unassigned issues have a null assignee',
  })
  assigneeId!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({
    example: 42,
    description: 'Total issues matching the filters',
  })
  total!: number;

  @ApiProperty({ example: 3, description: 'Total pages at the current limit' })
  pageCount!: number;
}

export class PaginatedIssuesDto {
  @ApiProperty({ type: [IssueResponseDto] })
  data!: IssueResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
