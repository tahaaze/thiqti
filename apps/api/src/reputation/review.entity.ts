import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  vehicle_id!: string;

  @Column({ nullable: true })
  author!: string;

  @Column("text", { nullable: true })
  text!: string;

  @Column("decimal", { precision: 3, scale: 1, nullable: true })
  score!: number;

  @Column({ nullable: true })
  sentiment!: string;

  @Column({ default: false })
  is_verified!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}
