import {
  IsOptional,
  IsEnum,
  IsString,
  IsUUID,
  IsArray,
  IsNumber,
  IsNotEmpty,
  IsEmail,
} from 'class-validator';
import { Status } from '../../@common/constants/status.constant';
import { AdminRole } from '../../@common/constants/role.constant';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';

export class GetUsersQueryDTO extends PaginationDTO {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsArray()
  @IsEnum(AdminRole, { each: true })
  roles?: AdminRole[];
}

export class UpdateUserRolesDTO {
  @IsArray()
  @IsEnum(AdminRole, { each: true })
  roles: AdminRole[];
}

export class GetBusinessesQueryDTO extends PaginationDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsString()
  cacNumber?: string;
}

export class GetPartnersQueryDTO extends PaginationDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsString()
  email?: string;
}

export class OnboardPartnerDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}

export class GetRequestsQueryDTO extends PaginationDTO {
  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsUUID()
  businessId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}

export class GetTransactionsQueryDTO extends PaginationDTO {
  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  businessId?: string;
}

export class UpdateBusinessStatusDTO {
  @IsEnum(Status)
  status: Status;
}

export class AssignRequestDTO {
  @IsUUID()
  assigneeId: string;
}

export class UpdateRequestStatusDTO {
  @IsEnum(Status)
  status: Status;
}
