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

  @Column("real", { default: 0 })
  avg_rating!: number;

  @Column("int", { default: 0 })
  total_reviews!: number;

  @Column("varchar", { length: 20, nullable: true })
  reliability!: string | null;

  @Column("text", { array: true, nullable: true })
  top_pros!: string[] | null;

  @Column("text", { array: true, nullable: true })
  top_cons!: string[] | null;

  @CreateDateColumn()
  computed_at!: Date;
}
