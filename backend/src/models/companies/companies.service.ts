import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company)
    private readonly companyModel: typeof Company,
  ) {}

  async create(dto: CreateCompanyDto): Promise<Company> {
    const slug = dto.slug?.trim() || slugify(dto.name);
    if (!slug) {
      throw new ConflictException(
        'Could not derive a valid slug from the provided name',
      );
    }

    const existing = await this.companyModel.findOne({
      where: { [Op.or]: [{ name: dto.name }, { slug }] },
    });
    if (existing) {
      if (existing.name === dto.name) {
        throw new ConflictException(
          `Company with name "${dto.name}" already exists`,
        );
      }
      throw new ConflictException(
        `Company with slug "${slug}" already exists`,
      );
    }

    return this.companyModel.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
    });
  }

  async findAll(): Promise<Company[]> {
    return this.companyModel.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findAllPublic(): Promise<
    Array<Pick<Company, 'id' | 'name' | 'slug'>>
  > {
    const rows = await this.companyModel.findAll({
      attributes: ['id', 'name', 'slug'],
      order: [['name', 'ASC']],
    });
    return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug }));
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyModel.findByPk(id);
    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.companyModel.findByPk(id);
    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    if (dto.name && dto.name !== company.name) {
      const clash = await this.companyModel.findOne({
        where: { name: dto.name },
      });
      if (clash) {
        throw new ConflictException(
          `Company with name "${dto.name}" already exists`,
        );
      }
    }

    if (dto.slug && dto.slug !== company.slug) {
      const clash = await this.companyModel.findOne({
        where: { slug: dto.slug },
      });
      if (clash) {
        throw new ConflictException(
          `Company with slug "${dto.slug}" already exists`,
        );
      }
    }

    await company.update({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.description !== undefined && { description: dto.description }),
    });

    return company;
  }

  async remove(id: string): Promise<{ message: string }> {
    const company = await this.companyModel.findByPk(id);
    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }
    const name = company.name;
    await company.destroy();
    return { message: `Company "${name}" has been successfully deleted` };
  }
}
