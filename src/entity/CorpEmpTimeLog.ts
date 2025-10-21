import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn //
} from 'typeorm';
import CorpEmp from './CorpEmp';
import Corporate from './Corporate';

@Entity(`${tablePrefix}corp_emp_time_log`)
export default class CorpEmpTimeLog {
  @PrimaryGeneratedColumn()
  corpEmpTimeLogId: number;

  @ManyToOne(() => Corporate)
  @JoinColumn({ name: 'corpId' })
  corpId: Corporate;

  @ManyToOne(() => CorpEmp)
  @JoinColumn({ name: 'corpEmpId' })
  corpEmpId: CorpEmp;

  @Column({ type: 'varchar', length: 250, nullable: false })
  corpEmpName: string;

  @Column({ type: 'date', nullable: false })
  corpEmpTimeLogDate: Date;

  @Column({ type: 'time', nullable: false })
  corpEmpClockIn: string;

  @Column({ type: 'time', nullable: true })
  corpEmpClockOut: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false, default: 0 })
  corpEmpHoursWorked: number;

  @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false, default: 0 })
  corpEmpEarnings: number;

  @Column({ type: 'longtext', nullable: true })
  corpEmpTimeLogNotes: string;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  corpEmpTimeLogCreatedDate: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  corpEmpTimeLogLastUpdatedDate: Date;
}
