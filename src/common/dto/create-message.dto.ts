import { IsString, IsMongoId, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsMongoId()
  receiverId!: string;

  @IsString()
  @MinLength(1)
  subject!: string;

  @IsString()
  @MinLength(1)
  body!: string;
}
