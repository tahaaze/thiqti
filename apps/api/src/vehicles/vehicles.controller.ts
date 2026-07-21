import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { VehiclesService } from "./vehicles.service";
import { CreateVehicleDto } from "./create-vehicle.dto";
import { UpdateVehicleDto } from "./update-vehicle.dto";
import { SearchVehiclesDto } from "./search-vehicles.dto";

@ApiTags("vehicles")
@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: "Create a vehicle listing" })
  @ApiResponse({ status: 201, description: "Vehicle created" })
  create(@Body() dto: CreateVehicleDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Search vehicles with filters" })
  search(@Query() query: SearchVehiclesDto) {
    return this.service.search(query);
  }

  @Get("all")
  @ApiOperation({ summary: "List all active vehicles" })
  findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get vehicle by ID" })
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a vehicle" })
  update(@Param("id") id: string, @Body() dto: UpdateVehicleDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete a vehicle" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
