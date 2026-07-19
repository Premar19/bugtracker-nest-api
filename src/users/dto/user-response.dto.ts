import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/enums';

/**
 * The public shape of a user. Deliberately has no passwordHash field: this is
 * what the API returns, and the hash must never leave the service layer.
 */
export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'jane@example.com' })
  email!: string;

  @ApiProperty({ enum: Role, example: Role.MEMBER })
  role!: Role;
}
