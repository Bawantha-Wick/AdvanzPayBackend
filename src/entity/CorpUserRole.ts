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
import Corporate from './Corporate';

@Entity(`${tablePrefix}corp_user_role`)
export default class CorpUserRole {
  @PrimaryGeneratedColumn()
  corpUserRoleId: number;

  @ManyToOne(() => Corporate)
  @JoinColumn({ name: 'corpId' })
  corpId: Corporate;

  @Column({ type: 'varchar', length: 250, nullable: false })
  corpUserRoleName: string;

  @Column({ type: 'varchar', length: 1000, nullable: false })
  corpUserRoleDescription: string;

  @Column({ type: 'longtext', nullable: false })
  corpUserRolePermission: string;

  @Column({ type: 'enum', enum: STATUS_ENUM, default: STATUS_ENUM.INACTIVE })
  corpUserRoleStatus: STATUS_ENUM;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  corpUserRoleCreatedDate: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  corpUserRoleUpdatedDate: Date;
}
