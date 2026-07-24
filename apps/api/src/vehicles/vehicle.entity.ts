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

  @Column("decimal", { precision: 12, scale: 0 })
  price!: number;

  @Column("decimal", { precision: 10, scale: 0 })
  km!: number;

  @Column()
  fuel!: string;

  @Column({ nullable: true })
  transmission!: string;

  @Column({ nullable: true })
  hp!: number;

  @Column({ nullable: true })
  color!: string;

  @Column({ nullable: true })
  city!: string;

  @Column({ nullable: true })
  image_url!: string;

  @Column("decimal", { precision: 4, scale: 1, nullable: true })
  engine!: number;

  @Column({ nullable: true })
  doors!: number;

  @Column({ nullable: true })
  seats!: number;

  @Column("decimal", { precision: 5, scale: 1, nullable: true })
  score!: number;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ nullable: true })
  dealer_id!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
