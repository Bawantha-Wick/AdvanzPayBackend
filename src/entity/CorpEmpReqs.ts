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
import CorpEmp from './CorpEmp';
import CorpUser from './CorpUser';

@Entity(`${tablePrefix}corp_emp_req`)
export default class CorpEmpReq {
  @PrimaryGeneratedColumn()
  corpEmpReqId: number;

  @ManyToOne(() => Corporate)
  @JoinColumn({ name: 'corpId' })
  corpId: Corporate;

  @ManyToOne(() => CorpEmp)
  @JoinColumn({ name: 'corpEmpId' })
  corpEmpId: CorpEmp;

  @Column({ type: 'timestamp', precision: 6, nullable: false })
  corpEmpReqDate: Date;

  @Column({ type: 'varchar', length: 500, nullable: false, unique: true })
  corpEmpRefNo: string;

  @Column({ type: 'varchar', length: 500, nullable: false, unique: true })
  corpEmpAccNo: string;

  @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false, default: 0 })
  corpEmpReqAmt: number;

  @Column({ type: 'enum', enum: STATUS_ENUM, default: STATUS_ENUM.INACTIVE })
  corpEmpReqStatus: STATUS_ENUM;

  @Column({ type: 'varchar', length: 500, nullable: false, unique: true })
  corpEmpReqRemark: string;

  @Column({ type: 'varchar', length: 250, nullable: false, unique: true })
  corpEmpReqType: string;

  @ManyToOne(() => CorpUser)
  @JoinColumn({ name: 'corpUsrId' })
  corpEmpReqMarkedBy: CorpUser;

  @Column({ type: 'timestamp', precision: 6, nullable: false })
  corpEmpReqMarkedDate: Date;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  corpEmpCreatedDate: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  corpEmpLastUpdatedDate: Date;
}
