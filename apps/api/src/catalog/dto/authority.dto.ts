import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAgentDto {
  @IsString() @MaxLength(300) name_ar: string;
  @IsOptional() @IsString() @MaxLength(300) name_en?: string;
  @IsEnum(['person', 'family', 'corporate_body']) agent_type: string;
  @IsOptional() @IsString() @MaxLength(500) authority_reference?: string;
}

export class CreateControlledTermDto {
  @IsString() @MaxLength(100) scheme: string;
  @IsString() @MaxLength(300) label_ar: string;
  @IsOptional() @IsString() @MaxLength(300) label_en?: string;
  @IsOptional() @IsString() @MaxLength(100) code?: string;
  @IsOptional() @IsString() broader_id?: string;
}

export class LinkAgentDto {
  @IsString() agent_id: string;
  @IsEnum(['creator', 'collector', 'custodian', 'subject']) role: string;
}

export class LinkTermDto {
  @IsString() term_id: string;
}
