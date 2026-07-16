import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { IssuePriority } from '../../../generated/prisma/enums';

export class CreateIssueDto {
  @ApiProperty({ example: 'Login button does nothing on Safari' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional({ example: 'Steps to reproduce: ...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: IssuePriority, default: IssuePriority.MEDIUM })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({ description: 'User id to assign the issue to' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
