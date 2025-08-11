import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn //
} from 'typeorm';
import CorpEmp from './CorpEmp';
import BankAccount from './BankAccount';
import { TRANSACTION_STATUS } from './Transaction';

export enum WITHDRAWAL_PURPOSE {
  PERSONAL = 'personal',
  EMERGENCY = 'emergency',
  MEDICAL = 'medical',
  EDUCATION = 'education',
  OTHER = 'other'
}

@Entity(`${tablePrefix}withdrawal`)
export default class Withdrawal {
  @PrimaryGeneratedColumn()
  withdrawalId: number;

  @ManyToOne(() => CorpEmp)
  @JoinColumn({ name: 'corpEmpId' })
  corpEmpId: CorpEmp;

  @ManyToOne(() => BankAccount)
  @JoinColumn({ name: 'bankAccountId' })
  bankAccountId: BankAccount;

  @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false })
  amount: number;

  // @Column({ type: 'enum', enum: WITHDRAWAL_PURPOSE, nullable: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  purpose: WITHDRAWAL_PURPOSE;

  @Column({ type: 'enum', enum: TRANSACTION_STATUS, default: TRANSACTION_STATUS.PENDING })
  status: TRANSACTION_STATUS;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceNumber: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'int', nullable: false })
  createdBy: number;

  @Column({ type: 'int', nullable: false })
  lastUpdatedBy: number;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updatedAt: Date;
}
