import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  vehicle_id!: string;

  @Column("varchar", { length: 50, default: "aggregated" })
  source!: string;

  @Column("varchar", { length: 200, nullable: true })
  author_name!: string | null;

  @Column("real", { nullable: true })
  rating!: number | null;

  @Column("varchar", { length: 300, nullable: true })
  title!: string | null;

  @Column("text", { nullable: true })
  body!: string | null;

  @Column("text", { array: true, nullable: true })
  pros!: string[] | null;

  @Column("text", { array: true, nullable: true })
  cons!: string[] | null;

  @Column({ default: false })
  verified!: boolean;

  @CreateDateColumn()
  published_at!: Date;

  @CreateDateColumn()
  created_at!: Date;
}
