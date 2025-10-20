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
import { STATUS_ENUM, PAY_TYPE_ENUM } from '../constant/enums.global';
import Corporate from './Corporate';

@Entity(`${tablePrefix}corp_emp`)
@Unique('Uq_corpEmpEmail_corpId', ['corpEmpEmail', 'corpId'])
// @Unique('Uq_corpEmpMobile_corpId', ['corpEmpMobile', 'corpId'])
export default class CorpEmp {
  @PrimaryGeneratedColumn()
  corpEmpId: number;

  @ManyToOne(() => Corporate)
  @JoinColumn({ name: 'corpId' })
  corpId: Corporate;

  @Column({ type: 'varchar', length: 250, nullable: false })
  corpEmpName: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  corpEmpEmail: string;

  @Column({ type: 'longtext', nullable: false })
  corpEmpPassword: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  corpEmpMobile: string;

  @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false, default: 0 })
  corpEmpBasicSalAmt: number;

  @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false, default: 0 })
  corpEmpMonthlyWtdAmt: number;

  @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false, default: 0 })
  corpEmpMonthlyRmnAmt: number;

  @Column({ type: 'varchar', length: 250, nullable: false })
  corpEmpAccNo: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  corpEmpAccName: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  corpEmpAccBank: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  corpEmpAccBranch: string;

  @Column({ type: 'enum', enum: STATUS_ENUM, default: STATUS_ENUM.INACTIVE })
  corpEmpStatus: STATUS_ENUM;

  @Column({ type: 'boolean', default: false })
  corpEmpIsInitiallyApproved: boolean;

  // new rate parameters;
  @Column({ type: 'enum', enum: PAY_TYPE_ENUM, default: PAY_TYPE_ENUM.MONTHLY })
  corpEmpPayType: PAY_TYPE_ENUM;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false, default: 0 })
  corpEmpNoOfHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false, default: 0 })
  corpEmpHourlyRate: number;

  @Column({ type: 'int', nullable: false })
  corpEmpCreatedBy: number;

  @Column({ type: 'int', nullable: false })
  corpEmpLastUpdatedBy: number;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  corpEmpCreatedDate: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  corpEmpLastUpdatedDate: Date;
}
