import { describe, it, expect, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";

vi.mock("../src/vehicles/vehicle.entity", () => ({
  Vehicle: class Vehicle {},
}));

import { VehiclesService } from "../src/vehicles/vehicles.service";

const vehicle = { id: "v1", make: "Toyota", model: "Corolla", year: 2023, price_mad: 250000 };

function makeQb(items: any[] = [], total = 0) {
  const calls: string[] = [];
  const qb: any = {
    andWhere: (...args: unknown[]) => {
      calls.push(`andWhere:${JSON.stringify(args)}`);
      return qb;
    },
    orderBy: (...args: unknown[]) => {
      calls.push(`orderBy:${JSON.stringify(args)}`);
      return qb;
    },
    addOrderBy: (...args: unknown[]) => {
      calls.push(`addOrderBy:${JSON.stringify(args)}`);
      return qb;
    },
    skip: (...args: unknown[]) => {
      calls.push(`skip:${JSON.stringify(args)}`);
      return qb;
    },
    take: (...args: unknown[]) => {
      calls.push(`take:${JSON.stringify(args)}`);
      return qb;
    },
    getManyAndCount: vi.fn(async () => [items, total]),
  };
  return { qb, calls };
}

function build(repo: any) {
  return new VehiclesService(repo);
}

describe("VehiclesService.search", () => {
  it("cherche sans filtre avec pagination par defaut", async () => {
    const { qb, calls } = makeQb([vehicle], 1);
    const service = build({ createQueryBuilder: () => qb });

    const result = await service.search({});

    expect(result).toEqual({ items: [vehicle], total: 1, limit: 20, offset: 0 });
    expect(calls).toContain('orderBy:["v.year","DESC"]');
    expect(calls).toContain('addOrderBy:["v.price_mad","ASC"]');
    expect(calls).toContain('skip:[0]');
    expect(calls).toContain('take:[20]');
  });

  it("applique un filtre make en ILIKE", async () => {
    const { qb, calls } = makeQb();
    const service = build({ createQueryBuilder: () => qb });

    await service.search({ make: "toy" });

    expect(calls).toContain('andWhere:["v.make ILIKE :make",{"make":"%toy%"}]');
  });

  it("applique les filtres exacts body/fuel/transmission", async () => {
    const { qb, calls } = makeQb();
    const service = build({ createQueryBuilder: () => qb });

    await service.search({ body_type: "suv", fuel_type: "diesel", transmission: "automatique" });

    expect(calls).toContain('andWhere:["v.body_type = :bodyType",{"bodyType":"suv"}]');
    expect(calls).toContain('andWhere:["v.fuel_type = :fuelType",{"fuelType":"diesel"}]');
    expect(calls).toContain('andWhere:["v.transmission = :transmission",{"transmission":"automatique"}]');
  });

  it("applique les bornes prix et annee", async () => {
    const { qb, calls } = makeQb();
    const service = build({ createQueryBuilder: () => qb });

    await service.search({ min_price: 100000, max_price: 500000, min_year: 2020, max_year: 2024 });

    expect(calls).toContain('andWhere:["v.price_mad >= :minPrice",{"minPrice":100000}]');
    expect(calls).toContain('andWhere:["v.price_mad <= :maxPrice",{"maxPrice":500000}]');
    expect(calls).toContain('andWhere:["v.year >= :minYear",{"minYear":2020}]');
    expect(calls).toContain('andWhere:["v.year <= :maxYear",{"maxYear":2024}]');
  });

  it("respecte limit et offset personnalises", async () => {
    const { qb, calls } = makeQb();
    const service = build({ createQueryBuilder: () => qb });

    const result = await service.search({ limit: 5, offset: 10 });

    expect(result.limit).toBe(5);
    expect(result.offset).toBe(10);
    expect(calls).toContain('skip:[10]');
    expect(calls).toContain('take:[5]');
  });
});

describe("VehiclesService CRUD", () => {
  it("cree un vehicule via create + save", async () => {
    const dto = { make: "Dacia", model: "Sandero", year: 2024 };
    const repo = {
      create: vi.fn(() => dto),
      save: vi.fn(async (v: unknown) => v),
    };
    const service = build(repo);

    const result = await service.create(dto as any);

    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(dto);
    expect(result).toBe(dto);
  });

  it("liste tous les vehicules tries", async () => {
    const repo = { find: vi.fn(async () => [vehicle]) };
    const service = build(repo);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(repo.find).toHaveBeenCalledWith({ order: { year: "DESC", price_mad: "ASC" } });
  });

  it("trouve un vehicule par id", async () => {
    const repo = { findOne: vi.fn(async () => vehicle) };
    const service = build(repo);

    const result = await service.findOne("v1");

    expect(result).toBe(vehicle);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: "v1" } });
  });

  it("leve NotFoundException si le vehicule n'existe pas", async () => {
    const repo = { findOne: vi.fn(async () => null) };
    const service = build(repo);

    await expect(service.findOne("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("met a jour un vehicule existant", async () => {
    const repo = {
      findOne: vi.fn(async () => vehicle),
      update: vi.fn(async () => undefined),
    };
    const service = build(repo);

    await service.update("v1", { price_mad: 260000 } as any);

    expect(repo.update).toHaveBeenCalledWith("v1", { price_mad: 260000 });
  });

  it("refuse la mise a jour d'un vehicule inconnu", async () => {
    const repo = { findOne: vi.fn(async () => null), update: vi.fn() };
    const service = build(repo);

    await expect(service.update("missing", {} as any)).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("supprime un vehicule existant", async () => {
    const repo = {
      findOne: vi.fn(async () => vehicle),
      delete: vi.fn(async () => undefined),
    };
    const service = build(repo);

    await service.remove("v1");

    expect(repo.delete).toHaveBeenCalledWith("v1");
  });

  it("refuse la suppression d'un vehicule inconnu", async () => {
    const repo = { findOne: vi.fn(async () => null), delete: vi.fn() };
    const service = build(repo);

    await expect(service.remove("missing")).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
