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

@Entity(`${tablePrefix}ad_user_login`)
export default class AdUserToken {
  @PrimaryGeneratedColumn()
  adUserLoginId: number;

  @ManyToOne(() => AdUser)
  @JoinColumn({ name: 'adUserId' })
  adUserId: AdUser;

  @Column({ type: 'longtext', nullable: false })
  adUserLoginAccessToken: string;

  @Column({ type: 'longtext', nullable: false })
  adUserLoginRefreshToken: string;

  @Column({ type: 'boolean', default: false, nullable: false })
  adUserLoginIsEnabled: boolean;

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  adUserLoginTokenCreatedDate: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  adUserLoginTokenUpdatedDate: Date;
}
