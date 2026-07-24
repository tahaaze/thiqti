import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("reputation_scores")
export class ReputationScore {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  vehicle_id!: string;

  @Column("decimal", { precision: 5, scale: 1 })
  overall!: number;

  @Column("decimal", { precision: 5, scale: 1, nullable: true })
  history!: number;

  @Column("decimal", { precision: 5, scale: 1, nullable: true })
  mechanical!: number;

  @Column("decimal", { precision: 5, scale: 1, nullable: true })
  reviews!: number;

  @Column("decimal", { precision: 5, scale: 1, nullable: true })
  price_value!: number;

  @Column("text", { nullable: true })
  analysis!: string;

  @CreateDateColumn()
  computed_at!: Date;
}
