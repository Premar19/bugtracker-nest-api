import { ApiProperty } from '@nestjs/swagger';

export class ProjectResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Mobile App' })
  name!: string;

  @ApiProperty({ nullable: true, example: 'iOS and Android client' })
  description!: string | null;

  @ApiProperty({
    format: 'uuid',
    description: 'The user who owns this project',
  })
  ownerId!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
