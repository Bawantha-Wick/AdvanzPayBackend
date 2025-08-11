import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique //
} from 'typeorm';
import { STATUS_ENUM } from '../constant/enums.global';
import CorpEmp from './CorpEmp';

@Entity(`${tablePrefix}bank_account`)
export default class BankAccount {
  @PrimaryGeneratedColumn()
  bankAccountId: number;

  @ManyToOne(() => CorpEmp)
  @JoinColumn({ name: 'corpEmpId' })
  corpEmpId: CorpEmp;

  @Column({ type: 'varchar', length: 50, nullable: false })
  accountNumber: string;

  @Column({ type: 'varchar', length: 250, nullable: false })
  holderName: string;

  @Column({ type: 'varchar', length: 250, nullable: false })
  bankName: string;

  @Column({ type: 'varchar', length: 250, nullable: false })
  branch: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  nickname: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

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
