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
import AdUser from './AdUser';

@Entity(`${tablePrefix}corp`)
export default class Corporate {
  @PrimaryGeneratedColumn()
  corpId: number;

  @Column({ type: 'varchar', length: 250, nullable: false, unique: true })
  corpName: string;

  @Column({ type: 'int', nullable: false })
  corpPayDay: number;

  @Column({ type: 'varchar', length: 250, nullable: false, unique: true })
  corpConPsnName: string;

  @Column({ type: 'varchar', length: 250, nullable: false, unique: true })
  corpConPsnTitle: string;

  @Column({ type: 'varchar', length: 500, nullable: false, unique: true })
  corpConPsnEmail: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  corpConPsnMobile: string;

  @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false, default: 0 })
  corpSalAdzMinAmt: number;

  @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false, default: 0 })
  corpSalAdzMaxAmt: number;

  @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false, default: 0 })
  corpSalAdzPercent: number;

  @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false, default: 0 })
  corpSalAdzCapAmt: number;

  @Column({ type: 'enum', enum: STATUS_ENUM, default: STATUS_ENUM.INACTIVE })
  adUserStatus: STATUS_ENUM;

  @Column({ type: 'int', nullable: false })
  corpCreatedBy: number;

  @Column({ type: 'int', nullable: false })
  corpLastUpdatedBy: number;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  corpCreatedDate: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  corpLastUpdatedDate: Date;
}
