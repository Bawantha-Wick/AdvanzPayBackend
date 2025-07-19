import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn //
} from 'typeorm';
import AdUser from './AdUser';

@Entity(`${tablePrefix}ad_user_otp`)
export default class AdOtp {
  @PrimaryGeneratedColumn()
  adOtpId: number;

  @Column({ type: 'varchar', length: 10, nullable: false, unique: true })
  adOtp: string;

  @ManyToOne(() => AdUser)
  @JoinColumn({ name: 'adUserId' })
  adOtpUserId: AdUser;

  @Column({ type: 'timestamp', precision: 6, nullable: false })
  adOtpExpiresAt: Date;

  @Column({ type: 'boolean', default: false, nullable: false })
  adOtpIsUsed: boolean;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  adOtpCreatedDate: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  adOtpUpdatedDate: Date;
}
