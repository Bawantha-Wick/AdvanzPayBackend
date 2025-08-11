import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn //
} from 'typeorm';
import { STATUS_ENUM } from '../constant/enums.global';
import CorpEmp from './CorpEmp';
import BankAccount from './BankAccount';

@Entity(`${tablePrefix}goal`)
export default class Goal {
  @PrimaryGeneratedColumn()
  goalId: number;

  @ManyToOne(() => CorpEmp)
  @JoinColumn({ name: 'corpEmpId' })
  corpEmpId: CorpEmp;

  @ManyToOne(() => BankAccount, { nullable: true })
  @JoinColumn({ name: 'accountId' })
  accountId: BankAccount;

  @Column({ type: 'varchar', length: 250, nullable: false })
  name: string;

  @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false })
  targetAmount: number;

  @Column({ type: 'decimal', precision: 50, scale: 2, default: 0 })
  currentAmount: number;

  @Column({ type: 'date', nullable: false })
  startDate: Date;

  @Column({ type: 'date', nullable: false })
  endDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: false })
  category: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string;

  @Column({ type: 'boolean', default: false })
  repeat: boolean;

  @Column({ type: 'enum', enum: STATUS_ENUM, default: STATUS_ENUM.ACTIVE })
  status: STATUS_ENUM;

  @Column({ type: 'int', nullable: false })
  createdBy: number;

  @Column({ type: 'int', nullable: false })
  lastUpdatedBy: number;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updatedAt: Date;
}
