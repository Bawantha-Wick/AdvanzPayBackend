import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn //
} from 'typeorm';
import { STATUS_ENUM } from '../constant/enums.global';

@Entity(`${tablePrefix}ad_user_role`)
export default class AdUserRole {
  @PrimaryGeneratedColumn()
  adUserRoleId: number;

  @Column({ type: 'varchar', length: 250, nullable: false })
  adUserRoleName: string;

  @Column({ type: 'varchar', length: 1000, nullable: false })
  adUserRoleDescription: string;

  @Column({ type: 'longtext', nullable: false })
  adUserRolePermission: string;

  @Column({ type: 'enum', enum: STATUS_ENUM, default: STATUS_ENUM.INACTIVE })
  adUserRoleStatus: STATUS_ENUM;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  adUserRoleCreatedDate: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  adUserRoleUpdatedDate: Date;
}
