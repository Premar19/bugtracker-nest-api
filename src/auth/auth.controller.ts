import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new account',
    description:
      'New accounts are always created with the MEMBER role. Promotion to ADMIN is a separate, admin-only operation.',
  })
  @ApiCreatedResponse({
    description:
      'Account created. Returns a JWT, so no separate login is needed.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed (malformed email, or password under 8 characters)',
  })
  @ApiConflictResponse({ description: 'That email is already registered' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in and receive a JWT',
    description:
      'Returns the same error for an unknown email and a wrong password, so the endpoint cannot be used to discover which accounts exist.',
  })
  @ApiOkResponse({ description: 'Authenticated', type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
