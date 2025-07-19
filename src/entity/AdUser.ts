import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn //
} from 'typeorm';
import { STATUS_ENUM } from '../constant/enums.global';
import AdUserRole from './AdUserRole';

@Entity(`${tablePrefix}ad_user`)
@Unique(['adUserMobile', 'adUserEmail'])
export default class AdUser {
  @PrimaryGeneratedColumn()
  adUserId: number;

  @Column({ type: 'varchar', length: 250, nullable: false })
  adUserName: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  adUserEmail: string;

  @Column({ type: 'longtext', nullable: false })
  adUserPassword: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  adUserMobile: string;

  @Column({ type: 'enum', enum: STATUS_ENUM, default: STATUS_ENUM.INACTIVE })
  adUserStatus: STATUS_ENUM;

  @ManyToOne(() => AdUserRole)
  @JoinColumn({ name: 'adUserRoleId' })
  adUserRoleId: AdUserRole;

  @Column({ type: 'boolean', default: false, nullable: false })
  adUserIsVerified: boolean;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  adUserCreatedDate: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  adUserUpdatedDate: Date;
}
