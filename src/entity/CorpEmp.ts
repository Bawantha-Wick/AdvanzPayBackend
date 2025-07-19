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
import Corporate from './Corporate';
import AdUser from './AdUser';

@Entity(`${tablePrefix}corp_emp`)
@Unique('Uq_corpEmpEmail_corpId', ['corpEmpEmail', 'corpId'])
@Unique('Uq_corpEmpMobile_corpId', ['corpEmpMobile', 'corpId'])
export default class CorpEmp {
  @PrimaryGeneratedColumn()
  corpEmpId: number;

  @ManyToOne(() => Corporate)
  @JoinColumn({ name: 'corpId' })
  corpId: Corporate;

  @Column({ type: 'varchar', length: 250, nullable: false, unique: true })
  corpEmpName: string;

  @Column({ type: 'varchar', length: 500, nullable: false, unique: true })
  corpEmpEmail: string;

  @Column({ type: 'longtext', nullable: false })
  corpEmpPassword: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  corpEmpMobile: string;

  @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false, default: 0 })
  corpEmpBasicSalAmt: number;

  @Column({ type: 'varchar', length: 250, nullable: false, unique: true })
  corpEmpAccNo: string;

  @Column({ type: 'varchar', length: 500, nullable: false, unique: true })
  corpEmpAccName: string;

  @Column({ type: 'varchar', length: 500, nullable: false, unique: true })
  corpEmpAccBank: string;

  @Column({ type: 'varchar', length: 500, nullable: false, unique: true })
  corpEmpAccBranch: string;

  @Column({ type: 'enum', enum: STATUS_ENUM, default: STATUS_ENUM.INACTIVE })
  corpEmpStatus: STATUS_ENUM;

  @Column({ type: 'int', nullable: false })
  corpEmpCreatedBy: number;

  @Column({ type: 'int', nullable: false })
  corpEmpLastUpdatedBy: number;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  corpEmpCreatedDate: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  corpEmpLastUpdatedDate: Date;
}
