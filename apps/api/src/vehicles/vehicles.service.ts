import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
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
    const qb = this.repo.createQueryBuilder("v").where("v.is_active = :active", { active: true });

    if (query.make) qb.andWhere("v.make ILIKE :make", { make: `%${query.make}%` });
    if (query.model) qb.andWhere("v.model ILIKE :model", { model: `%${query.model}%` });
    if (query.fuel) qb.andWhere("v.fuel = :fuel", { fuel: query.fuel });
    if (query.city) qb.andWhere("v.city ILIKE :city", { city: `%${query.city}%` });
    if (query.min_price) qb.andWhere("v.price >= :minPrice", { minPrice: query.min_price });
    if (query.max_price) qb.andWhere("v.price <= :maxPrice", { maxPrice: query.max_price });
    if (query.min_km) qb.andWhere("v.km >= :minKm", { minKm: query.min_km });
    if (query.max_km) qb.andWhere("v.km <= :maxKm", { maxKm: query.max_km });
    if (query.min_year) qb.andWhere("v.year >= :minYear", { minYear: query.min_year });
    if (query.max_year) qb.andWhere("v.year <= :maxYear", { maxYear: query.max_year });
    if (query.min_score) qb.andWhere("v.score >= :minScore", { minScore: query.min_score });

    const limit = query.limit || 20;
    const offset = query.offset || 0;

    qb.orderBy("v.score", "DESC")
      .addOrderBy("v.created_at", "DESC")
      .skip(offset)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, limit, offset };
  }

  async findAll(): Promise<Vehicle[]> {
    return this.repo.find({ where: { is_active: true }, order: { score: "DESC" } });
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
    await this.repo.update(id, { is_active: false });
  }
}
