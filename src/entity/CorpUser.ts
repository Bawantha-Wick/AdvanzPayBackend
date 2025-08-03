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
import CorpUserRole from './CorpUserRole';

@Entity(`${tablePrefix}corp_user`)
@Unique('Uq_corpUsrEmail_corpId', ['corpUsrEmail', 'corpId'])
@Unique('Uq_corpUsrMobile_corpId', ['corpUsrMobile', 'corpId'])
export default class CorpUser {
  @PrimaryGeneratedColumn()
  corpUsrId: number;

  @ManyToOne(() => Corporate)
  @JoinColumn({ name: 'corpId' })
  corpId: Corporate;

  @Column({ type: 'varchar', length: 250, nullable: false })
  corpUsrName: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  corpUsrEmail: string;

  @Column({ type: 'longtext', nullable: false })
  corpUsrPassword: string;

  @Column({ type: 'varchar', length: 250, nullable: false })
  corpUsrTitle: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  corpUsrMobile: string;

  @Column({ type: 'enum', enum: STATUS_ENUM, default: STATUS_ENUM.INACTIVE })
  corpUsrStatus: STATUS_ENUM;

  @ManyToOne(() => CorpUserRole)
  @JoinColumn({ name: 'corpUserRoleId' })
  corpUserRoleId: CorpUserRole;

  @Column({ type: 'int', nullable: false })
  corpUsrCreatedBy: number;

  @Column({ type: 'int', nullable: false })
  corpUsrLastUpdatedBy: number;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  corpUsrCreatedDate: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  corpUsrLastUpdatedDate: Date;
}
