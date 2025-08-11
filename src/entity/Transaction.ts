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
import Goal from './Goal';

export enum TRANSACTION_TYPE {
  SALARY = 'salary',
  BONUS = 'bonus',
  WITHDRAWAL = 'withdrawal',
  GOAL_CONTRIBUTION = 'goal_contribution',
  REFUND = 'refund'
}

export enum TRANSACTION_STATUS {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

@Entity(`${tablePrefix}transaction`)
export default class Transaction {
  @PrimaryGeneratedColumn()
  transactionId: number;

  @ManyToOne(() => CorpEmp)
  @JoinColumn({ name: 'corpEmpId' })
  corpEmpId: CorpEmp;

  @ManyToOne(() => BankAccount, { nullable: true })
  @JoinColumn({ name: 'bankAccountId' })
  bankAccountId: BankAccount;

  @ManyToOne(() => Goal, { nullable: true })
  @JoinColumn({ name: 'goalId' })
  goalId: Goal;

  @Column({ type: 'varchar', length: 500, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'enum', enum: TRANSACTION_TYPE, nullable: false })
  type: TRANSACTION_TYPE;

  @Column({ type: 'enum', enum: TRANSACTION_STATUS, default: TRANSACTION_STATUS.PENDING })
  status: TRANSACTION_STATUS;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'int', nullable: false })
  createdBy: number;

  @Column({ type: 'int', nullable: false })
  lastUpdatedBy: number;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updatedAt: Date;
}
