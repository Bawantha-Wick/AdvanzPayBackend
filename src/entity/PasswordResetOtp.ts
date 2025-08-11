import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn //
} from 'typeorm';
import { STATUS_ENUM } from '../constant/enums.global';

@Entity(`${tablePrefix}password_reset_otp`)
export default class PasswordResetOtp {
  @PrimaryGeneratedColumn()
  otpId: number;

  @Column({ type: 'varchar', length: 500, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  otpCode: string;

  @Column({ type: 'timestamp', precision: 6, nullable: false })
  expiresAt: Date;

  @Column({ type: 'enum', enum: STATUS_ENUM, default: STATUS_ENUM.ACTIVE })
  status: STATUS_ENUM;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ type: 'int', nullable: false })
  createdBy: number;

  @Column({ type: 'int', nullable: false })
  lastUpdatedBy: number;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updatedAt: Date;
}
