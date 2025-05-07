import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
@Unique(['userCode', 'userEmail'])
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  userCode: string;

  @Column({ type: 'varchar', length: 250, nullable: false })
  userFullName: string;

  @Column({ type: 'varchar', length: 500, nullable: false, unique: true })
  userEmail: string;

  @Column({ type: 'longtext', nullable: false })
  userPassword: string;

  @Column({ type: 'int', nullable: false })
  userOrgId: number;

  @Column({ type: 'boolean', default: false, nullable: false })
  userIsVerified: boolean;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  userCreatedDate: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  userUpdatedDate: Date;
}
