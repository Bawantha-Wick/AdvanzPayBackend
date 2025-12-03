import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn //
} from 'typeorm';
import { STATUS_ENUM } from '../constant/enums.global';

@Entity(`${tablePrefix}corp`)
export default class Corporate {
  @PrimaryGeneratedColumn()
  corpId: number;

  @Column({ type: 'varchar', length: 250, nullable: false })
  corpName: string;

  @Column({ type: 'text', nullable: false })
  corpRegAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  corpRegId: string;

  @Column({ type: 'int', nullable: false })
  corpPayDay: number;

  @Column({ type: 'varchar', length: 250, nullable: false })
  corpConPsnName: string;

  @Column({ type: 'varchar', length: 250, nullable: false })
  corpConPsnTitle: string;

  @Column({ type: 'varchar', length: 250, nullable: false })
  corpEmailDomain: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  corpConPsnEmail: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  corpConPsnMobile: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, default: 10000 })
  corpSalAdzMinAmt: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, default: 10000 })
  corpSalAdzMaxAmt: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, default: 10000 })
  corpSalAdzPercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, default: 10000 })
  corpSalAdzCapAmt: number;

  @Column({ type: 'int', nullable: false, default: 51 })
  corpMaxEwaPercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, default: 5.0 })
  corpAdhocTransFee: number;

  @Column({ type: 'boolean', nullable: false, default: true })
  corpEnableAutoApproval: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, default: 3.0 })
  corpManualWithdrawalFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, default: 2.0 })
  corpAutoWithdrawalFee: number;

  @Column({ type: 'boolean', nullable: false, default: true })
  corpAccountStatus: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  corpApproveStatus: boolean;

  @Column({ type: 'enum', enum: STATUS_ENUM, default: STATUS_ENUM.INACTIVE })
  corpStatus: STATUS_ENUM;

  @Column({ type: 'int', nullable: false })
  corpCreatedBy: number;

  @Column({ type: 'int', nullable: false })
  corpLastUpdatedBy: number;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  corpCreatedDate: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  corpLastUpdatedDate: Date;
}
