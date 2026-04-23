import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Param,
  Get,
  Delete,
  Put,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('api/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('public')
  @ApiOperation({
    summary: 'Public list of companies (id, name, slug only) for signup form',
  })
  findAllPublic() {
    return this.companiesService.findAllPublic();
  }

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'The company was created.' })
  @ApiResponse({ status: 409, description: 'Name or slug already exists.' })
  create(@Body(new ValidationPipe()) dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List all companies' })
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get a company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID (UUID)' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update a company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID (UUID)' })
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID (UUID)' })
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
