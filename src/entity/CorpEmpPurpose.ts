import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { STATUS_ENUM } from '../constant/enums.global';
import CorpEmp from './CorpEmp';

@Entity(`${tablePrefix}corp_emp_purpose`)
@Unique('Uq_corpEmpPurpose_title_empId', ['purposeTitle', 'corpEmpId'])
export default class CorpEmpPurpose {
  @PrimaryGeneratedColumn()
  corpEmpPurposeId: number;

  @ManyToOne(() => CorpEmp)
  @JoinColumn({ name: 'corpEmpId' })
  corpEmpId: CorpEmp;

  @Column({ type: 'varchar', length: 250, nullable: false })
  purposeTitle: string;

  //   @Column({ type: 'longtext', nullable: true })
  //   purposeDescription: string;

  //   @Column({ type: 'enum', enum: STATUS_ENUM, default: STATUS_ENUM.INACTIVE })
  //   purposeStatus: STATUS_ENUM;

  //   @Column({ type: 'int', nullable: false })
  //   purposeCreatedBy: number;

  //   @Column({ type: 'int', nullable: false })
  //   purposeLastUpdatedBy: number;

  //   @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  //   purposeCreatedDate: Date;

  //   @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  //   purposeLastUpdatedDate: Date;
}
