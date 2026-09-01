import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("vehicles")
export class Vehicle {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  make!: string;

  @Column()
  model!: string;

  @Column()
  year!: number;

  @Column()
  trim!: string;

  @Column()
  body_type!: string;

  @Column()
  fuel_type!: string;

  @Column()
  transmission!: string;

  @Column({ default: 5 })
  seats!: number;

  @Column("decimal", { precision: 12, scale: 0 })
  price_mad!: number;

  @Column("decimal", { precision: 12, scale: 0, nullable: true })
  price_old_mad!: number | null;

  @Column({ nullable: true })
  power_ch!: number;

  @Column("real", { nullable: true })
  consumption_l100!: number | null;

  @Column("int", { nullable: true })
  co2_gkm!: number | null;

  @Column("real", { nullable: true })
  accel_0_100!: number | null;

  @Column("int", { nullable: true })
  trunk_liters!: number | null;

  @Column("int", { nullable: true })
  length_mm!: number | null;

  @Column("int", { nullable: true })
  width_mm!: number | null;

  @Column("int", { nullable: true })
  height_mm!: number | null;

  @Column("int", { nullable: true })
  wheelbase_mm!: number | null;

  @Column({ nullable: true })
  image_url!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
