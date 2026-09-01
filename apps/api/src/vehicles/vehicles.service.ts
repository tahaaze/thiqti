import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import { Vehicle } from "./vehicle.entity";
import { CreateVehicleDto } from "./create-vehicle.dto";
import { UpdateVehicleDto } from "./update-vehicle.dto";
import { SearchVehiclesDto } from "./search-vehicles.dto";

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly repo: Repository<Vehicle>
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.repo.create(dto);
    return this.repo.save(vehicle);
  }

  async search(query: SearchVehiclesDto) {
    const where: FindOptionsWhere<Vehicle> = {};

    if (query.make) where.make = query.make;
    if (query.model) where.model = query.model;
    if (query.body_type) where.body_type = query.body_type;
    if (query.fuel_type) where.fuel_type = query.fuel_type;
    if (query.transmission) where.transmission = query.transmission;

    const qb = this.repo.createQueryBuilder("v");

    if (query.make) qb.andWhere("v.make ILIKE :make", { make: `%${query.make}%` });
    if (query.model) qb.andWhere("v.model ILIKE :model", { model: `%${query.model}%` });
    if (query.body_type) qb.andWhere("v.body_type = :bodyType", { bodyType: query.body_type });
    if (query.fuel_type) qb.andWhere("v.fuel_type = :fuelType", { fuelType: query.fuel_type });
    if (query.transmission) qb.andWhere("v.transmission = :transmission", { transmission: query.transmission });
    if (query.min_price) qb.andWhere("v.price_mad >= :minPrice", { minPrice: query.min_price });
    if (query.max_price) qb.andWhere("v.price_mad <= :maxPrice", { maxPrice: query.max_price });
    if (query.min_year) qb.andWhere("v.year >= :minYear", { minYear: query.min_year });
    if (query.max_year) qb.andWhere("v.year <= :maxYear", { maxYear: query.max_year });

    const limit = query.limit || 20;
    const offset = query.offset || 0;

    qb.orderBy("v.year", "DESC")
      .addOrderBy("v.price_mad", "ASC")
      .skip(offset)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, limit, offset };
  }

  async findAll(): Promise<Vehicle[]> {
    return this.repo.find({ order: { year: "DESC", price_mad: "ASC" } });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.repo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
