import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
  HttpCode,
  Param,
  HttpStatus,
  Get,
  Delete,
  Put,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('api/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('public/:clientId') // This makes it a public sub-route
  @ApiOperation({
    summary: "Get a client's public information by its Client ID",
  })
  findPublicInfo(@Param('clientId') clientId: string) {
    return this.clientsService.findPublicInfo(clientId);
  }

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new client application' })
  @ApiResponse({
    status: 201,
    description: 'The client has been successfully created.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin privileges required.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Client name already exists.',
  })
  create(@Body(new ValidationPipe()) createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all registered client applications' })
  @ApiResponse({ status: 200, description: 'A list of all clients.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin privileges required.',
  })
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get a client application by ID' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({
    status: 200,
    description: 'The client details.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin privileges required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Client with the specified ID does not exist.',
  })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update a client application by ID' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({
    status: 200,
    description: 'The client has been successfully updated.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin privileges required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Client with the specified ID does not exist.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict. Client name already exists.',
  })
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }
  @Post(':id/regenerate-secret')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate client secret when compromised' })
  @ApiResponse({
    status: 200,
    description: 'The client secret has been successfully regenerated.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin privileges required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Client with the specified ID does not exist.',
  })
  regenerateSecret(@Param('id') id: string) {
    return this.clientsService.regenerateSecret(id);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a client application by ID' })
  @ApiResponse({
    status: 200,
    description: 'The client has been successfully deleted.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin privileges required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Client with the specified ID does not exist.',
  })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
