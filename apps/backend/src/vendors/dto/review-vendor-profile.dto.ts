import { IsIn } from 'class-validator';

export class ReviewVendorProfileDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';
}
